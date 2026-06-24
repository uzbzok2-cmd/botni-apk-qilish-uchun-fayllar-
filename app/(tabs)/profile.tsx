import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { clearAll } from "@/lib/storage";

const LANG_LABELS: Record<string, string> = {
  russian: "Ruscha",
  english: "Inglizcha",
  turkish: "Turkcha",
};
const LANG_FLAGS: Record<string, string> = { russian: "🇷🇺", english: "🇬🇧", turkish: "🇹🇷" };

export default function ProfileTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, subscriptions, freeUsage, refresh } = useUser();
  const [tapCount, setTapCount] = useState(0);

  const s = styles(colors);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) {
      setTapCount(0);
      router.push("/admin");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Chiqish",
      "Hisobingizdan chiqmoqchimisiz? Barcha ma'lumotlar o'chadi.",
      [
        { text: "Bekor", style: "cancel" },
        {
          text: "Chiqish",
          style: "destructive",
          onPress: async () => {
            await clearAll();
            router.replace("/register");
          },
        },
      ]
    );
  };

  const langSubs = ["russian", "english", "turkish"].map((lang) => {
    const key = `tutor_${lang}`;
    const sub = subscriptions[key];
    return { lang, sub };
  });

  const examSubs = [
    { key: "ielts_", label: "IELTS Mock Exam" },
    { key: "cert_B2", label: "Rus tili B2" },
    { key: "cert_C1", label: "Rus tili C1" },
  ].filter(({ key }) => subscriptions[key]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }}
    >
      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.userName}>{user?.full_name ?? "Foydalanuvchi"}</Text>
        <Text style={s.userMeta}>
          {user?.age ? `${user.age} yosh` : ""}
          {user?.age && user?.gender ? " · " : ""}
          {user?.gender === "male" ? "Erkak" : user?.gender === "female" ? "Ayol" : ""}
        </Text>
        <Text style={s.userPhone}>{user?.phone_number ?? ""}</Text>
      </View>

      {/* Tutor subscriptions */}
      <Text style={s.sectionTitle}>Ustoz obunalari</Text>
      <View style={s.card}>
        {langSubs.map(({ lang, sub }) => {
          const active = !!sub && new Date(sub) > new Date();
          const days = active ? Math.ceil((new Date(sub!).getTime() - Date.now()) / 86400000) : 0;
          const free = freeUsage[lang as keyof typeof freeUsage] ?? 0;
          return (
            <View key={lang} style={s.subRow}>
              <Text style={s.subFlag}>{LANG_FLAGS[lang]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.subLang}>{LANG_LABELS[lang]}</Text>
                <Text style={[s.subStatus, { color: active ? colors.success : colors.mutedForeground }]}>
                  {active ? `${days} kun qoldi` : free > 0 ? `${free} ta bepul` : "Obuna kerak"}
                </Text>
              </View>
              {active
                ? <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                : <TouchableOpacity
                    style={s.buyBtn}
                    onPress={() => router.push({ pathname: "/payment", params: { payType: "tutor", language: lang } })}
                  >
                    <Text style={s.buyText}>Sotib olish</Text>
                  </TouchableOpacity>
              }
            </View>
          );
        })}
      </View>

      {/* Exam subscriptions */}
      {examSubs.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Imtihon obunalari</Text>
          <View style={s.card}>
            {examSubs.map(({ key, label }) => {
              const exp = subscriptions[key];
              const days = exp ? Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000) : 0;
              return (
                <View key={key} style={s.subRow}>
                  <Ionicons name="school" size={22} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.subLang}>{label}</Text>
                    <Text style={[s.subStatus, { color: colors.success }]}>{days} kun qoldi</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Settings */}
      <Text style={s.sectionTitle}>Sozlamalar</Text>
      <View style={s.card}>
        <TouchableOpacity style={s.settingRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[s.settingText, { color: colors.error }]}>Chiqish</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Version (secret admin tap) */}
      <TouchableOpacity style={s.version} onPress={handleVersionTap} activeOpacity={1}>
        <Text style={s.versionText}>v1.0.0 · Ustoz AI</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    avatarSection: { alignItems: "center", paddingHorizontal: 20, marginBottom: 28 },
    avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarText: { fontSize: 32, fontFamily: "DM_Sans_700Bold", color: "#fff" },
    userName: { fontSize: 22, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 4 },
    userMeta: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    userPhone: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginTop: 2 },
    sectionTitle: { fontSize: 13, fontFamily: "DM_Sans_600SemiBold", color: colors.mutedForeground, letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },
    card: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: "hidden" },
    subRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    subFlag: { fontSize: 24 },
    subLang: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: colors.foreground },
    subStatus: { fontSize: 12, fontFamily: "DM_Sans_400Regular", marginTop: 2 },
    buyBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    buyText: { color: "#fff", fontSize: 12, fontFamily: "DM_Sans_600SemiBold" },
    settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
    settingText: { flex: 1, fontSize: 15, fontFamily: "DM_Sans_500Medium" },
    version: { alignItems: "center", paddingVertical: 24 },
    versionText: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
  });
