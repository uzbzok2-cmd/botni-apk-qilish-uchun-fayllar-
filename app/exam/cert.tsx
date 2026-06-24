import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { apiGetCertExam, apiSubmitExam } from "@/lib/api";

type CSection = "info" | "reading" | "listening" | "grammar" | "writing" | "speaking" | "results";
const CSECTIONS: CSection[] = ["reading", "listening", "grammar", "writing", "speaking"];
const CLABELS: Record<string, string> = { reading: "O'qish", listening: "Tinglash", grammar: "Grammatika", writing: "Yozish", speaking: "Gapirish" };
const CTIMES: Record<string, number> = { reading: 60 * 60, listening: 40 * 60, grammar: 45 * 60, writing: 60 * 60, speaking: 15 * 60 };

interface CertQuestion { id: number; questionText: string; questionType: string; options: string[] | null }
interface Passage { id: number; title: string; text: string; questions: CertQuestion[] }
interface CertData {
  level: string;
  reading: { passages: Passage[] };
  listening: { parts: { partNumber: number; transcript: string; questions: CertQuestion[] }[] };
  grammar: { questions: CertQuestion[] };
  writing: { prompt: string };
  speaking: { questions: { id: number; partNumber: number; questionText: string }[] };
}

export default function CertScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { level = "B2" } = useLocalSearchParams<{ level: string }>();
  const { userId, subscriptions, refresh } = useUser();

  const subKey = `cert_${level.toUpperCase()}`;
  const isPurchased = !!subscriptions[subKey];

  const [section, setSection] = useState<CSection>("info");
  const [sectionIdx, setSectionIdx] = useState(0);
  const [examData, setExamData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => { loadExam(); }, []);

  useEffect(() => {
    if (section === "info" || section === "results") return;
    const total = CTIMES[section] ?? 3600;
    setTimeLeft(total);
    const t = setInterval(() => {
      setTimeLeft((p) => { if (p <= 1) { clearInterval(t); handleNext(); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [section]);

  const loadExam = async () => {
    try {
      const d = await apiGetCertExam(level.toUpperCase()) as { exam: CertData };
      setExamData(d.exam);
    } catch {
      Alert.alert("Xato", "Imtihon yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (sectionIdx < CSECTIONS.length - 1) {
      const next = sectionIdx + 1;
      setSectionIdx(next); setSection(CSECTIONS[next]);
    } else { submitExam(); }
  };

  const submitExam = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const res = await apiSubmitExam(userId, "cert", level.toUpperCase(), answers);
      setResults(res); setSection("results");
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Xato", "Topshirishda xato"); }
    finally { setSubmitting(false); }
  };

  const setAns = (k: string, v: string) => setAnswers((p) => ({ ...p, [k]: v }));
  const s = styles(colors);

  if (loading) return <View style={[s.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (section === "info") {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color={colors.foreground} /></TouchableOpacity>
          <Text style={s.headerTitle}>Rus tili sertifikati {level.toUpperCase()}</Text>
          <View style={{ width: 40 }} />
        </View>
        {!isPurchased ? (
          <View style={[s.card, { margin: 16, alignItems: "center" }]}>
            <Ionicons name="lock-closed" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
            <Text style={[s.title, { textAlign: "center" }]}>Imtihon sotib olinmagan</Text>
            <Text style={[s.subtitle, { textAlign: "center" }]}>Narxi: 28 000 UZS</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.push({ pathname: "/payment", params: { payType: "cert", level } })}>
              <Text style={s.primaryBtnText}>Sotib olish</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            <View style={s.levelBadge}>
              <Ionicons name="ribbon" size={24} color={level === "B2" ? colors.success : colors.accent} />
              <Text style={[s.levelText, { color: level === "B2" ? colors.success : colors.accent }]}>
                {level.toUpperCase()} · {level === "B2" ? "Upper-Intermediate" : "Advanced"}
              </Text>
            </View>
            <View style={[s.card, { marginBottom: 16 }]}>
              {CSECTIONS.map((sec) => (
                <View key={sec} style={s.sRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                  <Text style={s.sLabel}>{CLABELS[sec]}</Text>
                  <Text style={s.sTime}>{Math.floor(CTIMES[sec] / 60)} daqiqa</Text>
                </View>
              ))}
            </View>
            <Text style={s.passNote}>O'tish bali: {level === "C1" ? "70%" : "60%"} · Muvaffaqiyatda sertifikat beriladi</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => { setSection("reading"); setSectionIdx(0); }}>
              <Text style={s.primaryBtnText}>Boshlash</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  if (section === "results") {
    const r = results as Record<string, unknown>;
    const scores = r?.scores as Record<string, unknown> | null;
    const mcq = scores?.mcq as { correct: number; total: number; percentage: number } | null;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color={colors.foreground} /></TouchableOpacity>
          <Text style={s.headerTitle}>Natijalar</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[s.card, { margin: 16, alignItems: "center" }]}>
          <Ionicons name={r?.passed ? "trophy" : "ribbon"} size={56} color={r?.passed ? colors.accent : colors.primary} />
          <Text style={[s.title, { textAlign: "center", marginTop: 12 }]}>
            {r?.passed ? "Muvaffaqiyat!" : "Imtihon tugadi"}
          </Text>
          {mcq && (
            <View style={s.resultRow}>
              <Text style={s.rLabel}>Test qismi</Text>
              <Text style={s.rScore}>{mcq.correct}/{mcq.total} · {mcq.percentage}%</Text>
            </View>
          )}
          <View style={s.resultRow}>
            <Text style={s.rLabel}>Yozish</Text>
            <Text style={[s.rScore, { color: colors.warning }]}>Ko'rib chiqilmoqda</Text>
          </View>
          <View style={s.resultRow}>
            <Text style={s.rLabel}>Gapirish</Text>
            <Text style={[s.rScore, { color: colors.warning }]}>Ko'rib chiqilmoqda</Text>
          </View>
          {r?.passed && (
            <View style={s.certBox}>
              <Ionicons name="document-text" size={24} color={colors.accent} />
              <Text style={s.certText}>Sertifikat tayyorlanmoqda. 24 soat ichida jo'natiladi.</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[s.primaryBtn, { marginHorizontal: 16 }]} onPress={() => router.back()}>
          <Text style={s.primaryBtnText}>Yopish</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const cur = CSECTIONS[sectionIdx];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.examHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={s.sectionName}>{CLABELS[cur]}</Text>
        <View style={s.timerBox}>
          <Ionicons name="timer-outline" size={16} color={timeLeft < 300 ? colors.error : colors.foreground} />
          <Text style={[s.timerText, timeLeft < 300 && { color: colors.error }]}>{formatTime(timeLeft)}</Text>
        </View>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${(sectionIdx / CSECTIONS.length) * 100}%` }]} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {cur === "reading" && examData?.reading.passages.map((p) => (
          <View key={p.id} style={[s.card, { marginBottom: 16 }]}>
            <Text style={s.partTitle}>{p.title}</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: 12 }}>
              <Text style={s.passageText}>{p.text}</Text>
            </ScrollView>
            {p.questions.map((q) => <CertQ key={q.id} q={q} ans={answers[String(q.id)] ?? ""} setAns={(v) => setAns(String(q.id), v)} colors={colors} />)}
          </View>
        ))}
        {cur === "listening" && examData?.listening.parts.map((p) => (
          <View key={p.partNumber} style={[s.card, { marginBottom: 16 }]}>
            <Text style={s.partTitle}>Part {p.partNumber}</Text>
            <View style={s.transcriptBox}>
              <Text style={s.transcriptText}>{p.transcript}</Text>
            </View>
            {p.questions.map((q) => <CertQ key={q.id} q={q} ans={answers[String(q.id)] ?? ""} setAns={(v) => setAns(String(q.id), v)} colors={colors} />)}
          </View>
        ))}
        {cur === "grammar" && examData?.grammar.questions.map((q) => (
          <View key={q.id} style={[s.card, { marginBottom: 10 }]}>
            <CertQ q={q} ans={answers[String(q.id)] ?? ""} setAns={(v) => setAns(String(q.id), v)} colors={colors} />
          </View>
        ))}
        {cur === "writing" && (
          <View style={s.card}>
            <Text style={s.partTitle}>Yozma ish</Text>
            <Text style={s.questionText}>{examData?.writing.prompt}</Text>
            <Text style={s.wordCount}>Minimum: 250 so'z</Text>
            <TextInput style={s.essayInput} multiline placeholder="Inshongizni yozing..." placeholderTextColor={colors.mutedForeground} value={answers["writing"] ?? ""} onChangeText={(v) => setAns("writing", v)} />
          </View>
        )}
        {cur === "speaking" && examData?.speaking.questions.map((q) => (
          <View key={q.id} style={[s.card, { marginBottom: 12 }]}>
            <Text style={s.partTitle}>Part {q.partNumber}</Text>
            <Text style={s.questionText}>{q.questionText}</Text>
            <TextInput style={s.essayInput} multiline placeholder="Javobingizni yozing..." placeholderTextColor={colors.mutedForeground} value={answers[`sp_${q.id}`] ?? ""} onChangeText={(v) => setAns(`sp_${q.id}`, v)} />
          </View>
        ))}
      </ScrollView>
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={[s.primaryBtn, submitting && { opacity: 0.6 }]} onPress={handleNext} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>{sectionIdx < CSECTIONS.length - 1 ? "Keyingi" : "Topshirish"}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CertQ({ q, ans, setAns, colors }: { q: CertQuestion; ans: string; setAns: (v: string) => void; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  const s = qS(colors);
  return (
    <View style={s.container}>
      <Text style={s.qText}>{q.questionText}</Text>
      {q.options && q.options.length > 0 ? q.options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const selected = ans === letter || ans === opt;
        return (
          <TouchableOpacity key={i} style={[s.opt, selected && s.optSel]} onPress={() => { setAns(letter); Haptics.selectionAsync(); }}>
            <View style={[s.circle, selected && s.circleSel]}><Text style={[s.letter, selected && { color: "#fff" }]}>{letter}</Text></View>
            <Text style={[s.optText, selected && { color: colors.primary }]}>{opt}</Text>
          </TouchableOpacity>
        );
      }) : (
        <TextInput style={s.short} placeholder="Javob..." placeholderTextColor={colors.mutedForeground} value={ans} onChangeText={setAns} />
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 16 },
    title: { fontSize: 22, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 6 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginBottom: 20 },
    levelBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
    levelText: { fontSize: 17, fontFamily: "DM_Sans_700Bold" },
    sRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
    sLabel: { flex: 1, fontSize: 14, fontFamily: "DM_Sans_500Medium", color: colors.foreground },
    sTime: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    passNote: { fontSize: 13, color: colors.primary, fontFamily: "DM_Sans_500Medium", textAlign: "center", marginBottom: 20 },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 16, alignItems: "center" },
    primaryBtnText: { color: "#fff", fontSize: 17, fontFamily: "DM_Sans_700Bold" },
    examHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    sectionName: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    timerBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    timerText: { fontSize: 14, fontFamily: "DM_Sans_600SemiBold", color: colors.foreground },
    progressTrack: { height: 3, backgroundColor: colors.muted },
    progressFill: { height: 3, backgroundColor: colors.success },
    partTitle: { fontSize: 15, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 10 },
    passageText: { fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular", lineHeight: 21 },
    questionText: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: colors.foreground, marginBottom: 10 },
    wordCount: { fontSize: 12, color: colors.accent, fontFamily: "DM_Sans_500Medium", marginBottom: 8 },
    essayInput: { backgroundColor: colors.muted, borderRadius: 12, padding: 14, minHeight: 150, fontSize: 14, color: colors.foreground, fontFamily: "DM_Sans_400Regular", textAlignVertical: "top" },
    transcriptBox: { backgroundColor: colors.muted, borderRadius: 10, padding: 12, marginBottom: 14 },
    transcriptText: { fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular", lineHeight: 20 },
    bottomBar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, width: "100%", borderBottomWidth: 1, borderBottomColor: colors.border },
    rLabel: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: colors.foreground },
    rScore: { fontSize: 14, fontFamily: "DM_Sans_700Bold", color: colors.primary },
    certBox: { flexDirection: "row", gap: 10, backgroundColor: colors.accent + "22", borderRadius: 12, padding: 14, marginTop: 16, alignItems: "center" },
    certText: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular" },
  });

const qS = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    container: { marginBottom: 18 },
    qText: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: colors.foreground, marginBottom: 10 },
    opt: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 7 },
    optSel: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    circle: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    circleSel: { backgroundColor: colors.primary },
    letter: { fontSize: 12, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    optText: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular" },
    short: { backgroundColor: colors.muted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.foreground },
  });
