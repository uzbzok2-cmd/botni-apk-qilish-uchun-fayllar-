import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { apiRegister } from "@/lib/api";

const STEPS = ["Ism", "Yosh", "Jinsi", "Telefon"];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { initUserId, refresh } = useUser();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progress = useRef(new Animated.Value(0)).current;

  const animateProgress = (toStep: number) => {
    Animated.spring(progress, {
      toValue: toStep / (STEPS.length - 1),
      useNativeDriver: false,
    }).start();
  };

  const next = async () => {
    setError("");
    if (step === 0 && fullName.trim().length < 2) { setError("Iltimos, to'liq ismingizni kiriting"); return; }
    if (step === 1 && (!age || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 99)) {
      setError("Yoshingizni to'g'ri kiriting (10–99)"); return;
    }
    if (step === 2 && !gender) { setError("Jinsni tanlang"); return; }
    if (step === 3) {
      if (phone.trim().length < 9) { setError("Telefon raqamni kiriting"); return; }
      await submit(); return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateProgress(step + 1);
    setStep(s => s + 1);
  };

  const back = () => {
    if (step === 0) return;
    animateProgress(step - 1);
    setStep(s => s - 1);
    setError("");
  };

  const submit = async () => {
    setLoading(true);
    try {
      const userId = await initUserId();
      await apiRegister(userId, fullName.trim(), phone.trim(), Number(age), gender);
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          {step > 0 && (
            <TouchableOpacity onPress={back} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <Text style={s.logo}>Ustoz AI</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={s.stepLabel}>Qadam {step + 1} / {STEPS.length}</Text>

        {/* Step content */}
        <View style={s.content}>
          {step === 0 && (
            <>
              <Text style={s.title}>Ismingizni kiriting</Text>
              <Text style={s.subtitle}>Ustoz siz bilan shu ism bilan muloqot qiladi</Text>
              <TextInput
                style={s.input}
                placeholder="To'liq ismingiz"
                placeholderTextColor={colors.mutedForeground}
                value={fullName}
                onChangeText={setFullName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={next}
              />
            </>
          )}
          {step === 1 && (
            <>
              <Text style={s.title}>Yoshingiz?</Text>
              <Text style={s.subtitle}>Bu sizga mos tarkib tayyorlashga yordam beradi</Text>
              <TextInput
                style={s.input}
                placeholder="Masalan: 22"
                placeholderTextColor={colors.mutedForeground}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={next}
              />
            </>
          )}
          {step === 2 && (
            <>
              <Text style={s.title}>Jinsingiz?</Text>
              <Text style={s.subtitle}>Ustoz uslubini moslashtirish uchun</Text>
              <View style={s.genderRow}>
                <TouchableOpacity
                  style={[s.genderBtn, gender === "male" && s.genderSelected]}
                  onPress={() => { setGender("male"); Haptics.selectionAsync(); }}
                >
                  <Ionicons name="man" size={32} color={gender === "male" ? "#fff" : colors.primary} />
                  <Text style={[s.genderText, gender === "male" && { color: "#fff" }]}>Erkak</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.genderBtn, gender === "female" && s.genderSelected]}
                  onPress={() => { setGender("female"); Haptics.selectionAsync(); }}
                >
                  <Ionicons name="woman" size={32} color={gender === "female" ? "#fff" : colors.primary} />
                  <Text style={[s.genderText, gender === "female" && { color: "#fff" }]}>Ayol</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={s.title}>Telefon raqamingiz</Text>
              <Text style={s.subtitle}>Admin bilan aloqa uchun ishlatiladi</Text>
              <TextInput
                style={s.input}
                placeholder="+998 90 123 45 67"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={next}
              />
            </>
          )}

          {!!error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity
            style={[s.nextBtn, loading && { opacity: 0.6 }]}
            onPress={next}
            disabled={loading}
          >
            <Text style={s.nextText}>
              {loading ? "Yuklanmoqda..." : step === STEPS.length - 1 ? "Boshlash" : "Keyingisi"}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 24 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    logo: { fontSize: 22, fontFamily: "DM_Sans_700Bold", color: colors.primary },
    progressTrack: { height: 4, backgroundColor: colors.muted, marginHorizontal: 20, borderRadius: 4, marginBottom: 8 },
    progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 4 },
    stepLabel: { textAlign: "center", color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", fontSize: 13, marginBottom: 40 },
    content: { paddingHorizontal: 24 },
    title: { fontSize: 28, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginBottom: 32 },
    input: {
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: colors.radius, paddingHorizontal: 18, paddingVertical: 16,
      fontSize: 17, color: colors.foreground, fontFamily: "DM_Sans_400Regular", marginBottom: 16,
    },
    genderRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
    genderBtn: {
      flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 24,
      backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1.5, borderColor: colors.border, gap: 8,
    },
    genderSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    genderText: { fontSize: 16, fontFamily: "DM_Sans_600SemiBold", color: colors.primary },
    error: { color: colors.error, fontSize: 13, fontFamily: "DM_Sans_400Regular", marginBottom: 12 },
    nextBtn: {
      backgroundColor: colors.primary, borderRadius: colors.radius,
      paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
    },
    nextText: { color: "#fff", fontSize: 17, fontFamily: "DM_Sans_700Bold" },
  });
