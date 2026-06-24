import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { apiGetIeltsExam, apiSubmitExam } from "@/lib/api";

type Section = "info" | "listening" | "reading" | "writing" | "speaking" | "results";

interface Question { id: number; questionText: string; questionType: string; options: string[] | null; questionNumber: number; partNumber: number; marks: number }
interface ExamData {
  id: number; title: string;
  listening: { parts: { partNumber: number; transcript: string; questions: Question[] }[] };
  reading: { passages: { passageNumber: number; title: string; text: string; questions: Question[] }[] };
  writing: { tasks: { taskNumber: number; prompt: string }[] };
  speaking: { questions: { id: number; partNumber: number; questionText: string }[] };
}

const SECTIONS: Section[] = ["listening", "reading", "writing", "speaking"];
const SECTION_LABELS: Record<string, string> = {
  listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking",
};
const SECTION_TIMES: Record<string, number> = {
  listening: 40 * 60, reading: 60 * 60, writing: 60 * 60, speaking: 15 * 60,
};
const SECTION_ICONS: Record<string, "headset" | "book" | "create" | "mic"> = {
  listening: "headset", reading: "book", writing: "create", speaking: "mic",
};

export default function IeltsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId, subscriptions } = useUser();

  const [section, setSection] = useState<Section>("info");
  const [sectionIdx, setSectionIdx] = useState(0);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const isPurchased = !!subscriptions["ielts_"];

  useEffect(() => {
    loadExam();
  }, []);

  useEffect(() => {
    if (section === "info" || section === "results") return;
    const total = SECTION_TIMES[section] ?? 3600;
    setTimeLeft(total);
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); handleNextSection(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [section]);

  const loadExam = async () => {
    try {
      const d = await apiGetIeltsExam() as { exam: ExamData };
      setExamData(d.exam);
    } catch {
      Alert.alert("Xato", "Imtihon ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleNextSection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (sectionIdx < SECTIONS.length - 1) {
      const next = sectionIdx + 1;
      setSectionIdx(next);
      setSection(SECTIONS[next]);
    } else {
      submitExam();
    }
  };

  const submitExam = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const res = await apiSubmitExam(userId, "ielts", null, answers);
      setResults(res);
      setSection("results");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Xato", "Yuborishda xato yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (key: string, val: string) => setAnswers((p) => ({ ...p, [key]: val }));

  const s = styles(colors);

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (section === "info") {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>IELTS Mock Exam</Text>
          <View style={{ width: 40 }} />
        </View>

        {!isPurchased ? (
          <View style={[s.card, { margin: 16 }]}>
            <Ionicons name="lock-closed" size={48} color={colors.mutedForeground} style={{ alignSelf: "center", marginBottom: 16 }} />
            <Text style={[s.title, { textAlign: "center" }]}>Imtihon sotib olinmagan</Text>
            <Text style={[s.subtitle, { textAlign: "center" }]}>IELTS Mock Exam narxi: 28 000 UZS</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.push({ pathname: "/payment", params: { payType: "ielts" } })}>
              <Text style={s.primaryBtnText}>Sotib olish</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[s.card, { margin: 16 }]}>
              <Text style={s.title}>IELTS Mock Exam</Text>
              <Text style={s.subtitle}>{examData?.title ?? "To'liq simulyatsiya"}</Text>
              {SECTIONS.map((sec) => (
                <View key={sec} style={s.sectionRow}>
                  <Ionicons name={SECTION_ICONS[sec]} size={20} color={colors.primary} />
                  <Text style={s.sectionLabel}>{SECTION_LABELS[sec]}</Text>
                  <Text style={s.sectionTime}>{Math.floor(SECTION_TIMES[sec] / 60)} daqiqa</Text>
                </View>
              ))}
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              <View style={s.warningBox}>
                <Ionicons name="warning" size={18} color={colors.warning} />
                <Text style={s.warningText}>Imtihon boshlanganidan so'ng, har bir bo'lim uchun vaqt hisoblanadi. Tayyor bo'lsangiz boshlang.</Text>
              </View>
              <TouchableOpacity style={s.primaryBtn} onPress={() => { setSection("listening"); setSectionIdx(0); }}>
                <Text style={s.primaryBtnText}>Imtihonni boshlash</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  if (section === "results") {
    const r = results as Record<string, unknown>;
    const scores = r?.scores as Record<string, unknown> | null;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Natijalar</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[s.card, { margin: 16, alignItems: "center" }]}>
          <Ionicons name="trophy" size={56} color={colors.accent} />
          <Text style={[s.title, { textAlign: "center", marginTop: 12 }]}>Imtihon tugadi!</Text>
          {scores && (
            <>
              {(["listening", "reading"] as const).map((sec) => {
                const d = scores[sec] as { correct: number; total: number; band: number } | null;
                if (!d) return null;
                return (
                  <View key={sec} style={s.resultRow}>
                    <Text style={s.resultLabel}>{SECTION_LABELS[sec]}</Text>
                    <Text style={s.resultScore}>{d.correct}/{d.total} · Band {d.band}</Text>
                  </View>
                );
              })}
              {(["writing", "speaking"] as const).map((sec) => (
                <View key={sec} style={s.resultRow}>
                  <Text style={s.resultLabel}>{SECTION_LABELS[sec]}</Text>
                  <Text style={[s.resultScore, { color: colors.warning }]}>Ko'rib chiqilmoqda</Text>
                </View>
              ))}
              <View style={[s.resultRow, { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12 }]}>
                <Text style={[s.resultLabel, { fontFamily: "DM_Sans_700Bold" }]}>Hozirgi ball</Text>
                <Text style={[s.resultScore, { color: colors.primary, fontSize: 20 }]}>
                  {(scores.overall as string) ?? "—"}
                </Text>
              </View>
            </>
          )}
          <Text style={s.resultNote}>Writing va Speaking bo'limlari AI tomonidan tekshiriladi va 24 soat ichida natija yuboriladi.</Text>
        </View>
        <TouchableOpacity style={[s.primaryBtn, { marginHorizontal: 16 }]} onPress={() => router.back()}>
          <Text style={s.primaryBtnText}>Yopish</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const currentSection = SECTIONS[sectionIdx];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Exam header */}
      <View style={[s.examHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={s.sectionName}>{SECTION_LABELS[currentSection]}</Text>
        <View style={s.timerBox}>
          <Ionicons name="timer-outline" size={16} color={timeLeft < 300 ? colors.error : colors.foreground} />
          <Text style={[s.timerText, timeLeft < 300 && { color: colors.error }]}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${((sectionIdx) / SECTIONS.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {currentSection === "listening" && examData?.listening.parts.map((part) => (
          <View key={part.partNumber} style={[s.card, { marginBottom: 16 }]}>
            <Text style={s.partTitle}>Part {part.partNumber}</Text>
            {part.transcript && (
              <View style={s.transcriptBox}>
                <Text style={s.transcriptLabel}>Matn (Audio o'rniga):</Text>
                <Text style={s.transcriptText}>{part.transcript}</Text>
              </View>
            )}
            {part.questions.map((q) => (
              <QuestionView key={q.id} q={q} answer={answers[String(q.id)] ?? ""} setAnswer={(v) => setAnswer(String(q.id), v)} colors={colors} />
            ))}
          </View>
        ))}

        {currentSection === "reading" && examData?.reading.passages.map((p) => (
          <View key={p.passageNumber} style={[s.card, { marginBottom: 16 }]}>
            <Text style={s.partTitle}>Passage {p.passageNumber}: {p.title}</Text>
            <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
              <Text style={s.passageText}>{p.text}</Text>
            </ScrollView>
            {p.questions.map((q) => (
              <QuestionView key={q.id} q={q} answer={answers[String(q.id)] ?? ""} setAnswer={(v) => setAnswer(String(q.id), v)} colors={colors} />
            ))}
          </View>
        ))}

        {currentSection === "writing" && examData?.writing.tasks.map((t) => (
          <View key={t.taskNumber} style={[s.card, { marginBottom: 16 }]}>
            <Text style={s.partTitle}>Task {t.taskNumber}</Text>
            <Text style={s.questionText}>{t.prompt}</Text>
            <Text style={s.wordCount}>Min: {t.taskNumber === 1 ? 150 : 250} so'z</Text>
            <TextInput
              style={s.essayInput}
              multiline
              placeholder="Inshoingizni shu yerga yozing..."
              placeholderTextColor={colors.mutedForeground}
              value={answers[`w_${t.taskNumber}`] ?? ""}
              onChangeText={(v) => setAnswer(`w_${t.taskNumber}`, v)}
            />
          </View>
        ))}

        {currentSection === "speaking" && examData?.speaking.questions.map((q) => (
          <View key={q.id} style={[s.card, { marginBottom: 12 }]}>
            <Text style={s.partTitle}>Part {q.partNumber}</Text>
            <Text style={s.questionText}>{q.questionText}</Text>
            <TextInput
              style={s.essayInput}
              multiline
              placeholder="Javobingizni yozing..."
              placeholderTextColor={colors.mutedForeground}
              value={answers[`s_${q.id}`] ?? ""}
              onChangeText={(v) => setAnswer(`s_${q.id}`, v)}
            />
          </View>
        ))}
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[s.nextBtn, submitting && { opacity: 0.6 }]}
          onPress={handleNextSection}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.nextBtnText}>
              {sectionIdx < SECTIONS.length - 1 ? "Keyingi bo'lim" : "Topshirish"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function QuestionView({ q, answer, setAnswer, colors }: {
  q: Question; answer: string;
  setAnswer: (v: string) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const s = qStyles(colors);
  return (
    <View style={s.container}>
      <Text style={s.questionText}>{q.questionNumber}. {q.questionText}</Text>
      {q.options && q.options.length > 0 ? (
        q.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const selected = answer === letter || answer === opt;
          return (
            <TouchableOpacity
              key={i}
              style={[s.option, selected && s.optionSelected]}
              onPress={() => { setAnswer(letter); Haptics.selectionAsync(); }}
            >
              <View style={[s.optionCircle, selected && s.optionCircleSelected]}>
                <Text style={[s.optionLetter, selected && { color: "#fff" }]}>{letter}</Text>
              </View>
              <Text style={[s.optionText, selected && { color: colors.primary, fontFamily: "DM_Sans_600SemiBold" }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })
      ) : (
        <TextInput
          style={s.shortAnswer}
          placeholder="Javobingiz..."
          placeholderTextColor={colors.mutedForeground}
          value={answer}
          onChangeText={setAnswer}
        />
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 16 },
    title: { fontSize: 22, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 6 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginBottom: 20 },
    sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
    sectionLabel: { flex: 1, fontSize: 15, fontFamily: "DM_Sans_500Medium", color: colors.foreground },
    sectionTime: { fontSize: 13, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    warningBox: { flexDirection: "row", gap: 10, backgroundColor: colors.warning + "22", borderRadius: 12, padding: 14, marginBottom: 16, alignItems: "flex-start" },
    warningText: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular", lineHeight: 20 },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 16, alignItems: "center" },
    primaryBtnText: { color: "#fff", fontSize: 17, fontFamily: "DM_Sans_700Bold" },
    examHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    sectionName: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    timerBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    timerText: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: colors.foreground },
    progressTrack: { height: 3, backgroundColor: colors.muted },
    progressFill: { height: 3, backgroundColor: colors.primary },
    partTitle: { fontSize: 16, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 12 },
    transcriptBox: { backgroundColor: colors.muted, borderRadius: 10, padding: 12, marginBottom: 16 },
    transcriptLabel: { fontSize: 12, fontFamily: "DM_Sans_600SemiBold", color: colors.mutedForeground, marginBottom: 6 },
    transcriptText: { fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular", lineHeight: 20 },
    passageText: { fontSize: 14, color: colors.foreground, fontFamily: "DM_Sans_400Regular", lineHeight: 22 },
    questionText: { fontSize: 15, fontFamily: "DM_Sans_500Medium", color: colors.foreground, marginBottom: 12 },
    wordCount: { fontSize: 12, color: colors.accent, fontFamily: "DM_Sans_500Medium", marginBottom: 8 },
    essayInput: { backgroundColor: colors.muted, borderRadius: 12, padding: 14, minHeight: 160, fontSize: 14, color: colors.foreground, fontFamily: "DM_Sans_400Regular", textAlignVertical: "top" },
    bottomBar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    nextBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 16, alignItems: "center" },
    nextBtnText: { color: "#fff", fontSize: 17, fontFamily: "DM_Sans_700Bold" },
    resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, width: "100%", borderBottomWidth: 1, borderBottomColor: colors.border },
    resultLabel: { fontSize: 15, fontFamily: "DM_Sans_500Medium", color: colors.foreground },
    resultScore: { fontSize: 15, fontFamily: "DM_Sans_700Bold", color: colors.primary },
    resultNote: { fontSize: 13, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", textAlign: "center", marginTop: 16, lineHeight: 20 },
  });

const qStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    container: { marginBottom: 20 },
    questionText: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: colors.foreground, marginBottom: 10, lineHeight: 20 },
    option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
    optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    optionCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    optionCircleSelected: { backgroundColor: colors.primary },
    optionLetter: { fontSize: 13, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    optionText: { flex: 1, fontSize: 14, color: colors.foreground, fontFamily: "DM_Sans_400Regular" },
    shortAnswer: { backgroundColor: colors.muted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground, fontFamily: "DM_Sans_400Regular" },
  });
