import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";

const LANGS = [
  {
    key: "russian",
    name: "Natasha",
    lang: "Ruscha",
    flag: "🇷🇺",
    color: "#4F8EF7",
    subKey: "tutor_russian",
    desc: "Rus tili bo'yicha AI ustoz",
  },
  {
    key: "english",
    name: "Emma",
    lang: "Inglizcha",
    flag: "🇬🇧",
    color: "#22C55E",
    subKey: "tutor_english",
    desc: "English AI language tutor",
  },
  {
    key: "turkish",
    name: "Aysha",
    lang: "Turkcha",
    flag: "🇹🇷",
    color: "#F59E0B",
    subKey: "tutor_turkish",
    desc: "Türkçe yapay zeka öğretmeni",
  },
];

export default function HomeTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, subscriptions, freeUsage, refresh } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const s = styles(colors);

  const getStatus = (subKey: string, langKey: string) => {
    if (subscriptions[subKey]) {
      const exp = new Date(subscriptions[subKey]!);
      const days = Math.max(0, Math.ceil((exp.getTime() - Date.now()) / 86400000));
      return { type: "active" as const, label: `${days} kun qoldi` };
    }
    const free = freeUsage[langKey as keyof typeof freeUsage] ?? 0;
    if (free > 0) return { type: "free" as const, label: `${free} ta bepul xabar` };
    return { type: "locked" as const, label: "Obuna kerak" };
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Assalomu alaykum,</Text>
          <Text style={s.userName}>{user?.full_name?.split(" ")[0] ?? "Do'stim"}</Text>
        </View>
        <View style={s.logoBox}>
          <Text style={s.logoText}>AI</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Tilni tanlang</Text>

      {LANGS.map((l) => {
        const status = getStatus(l.subKey, l.key);
        return (
          <TouchableOpacity
            key={l.key}
            style={s.card}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/chat/${l.key}`);
            }}
          >
            <View style={[s.flagBox, { backgroundColor: l.color + "22" }]}>
              <Text style={s.flag}>{l.flag}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.cardTop}>
                <Text style={s.tutorName}>{l.name}</Text>
                <View style={[
                  s.badge,
                  status.type === "active" ? s.badgeActive :
                  status.type === "free" ? s.badgeFree : s.badgeLocked
                ]}>
                  <Text style={[
                    s.badgeText,
                    status.type === "active" ? { color: colors.success } :
                    status.type === "free" ? { color: colors.primary } : { color: colors.mutedForeground }
                  ]}>
                    {status.label}
                  </Text>
                </View>
              </View>
              <Text style={s.langName}>{l.lang}</Text>
              <Text style={s.desc}>{l.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      })}

      {/* Tip box */}
      <View style={s.tipBox}>
        <Ionicons name="bulb" size={20} color={colors.accent} />
        <Text style={s.tipText}>
          Har kuni 10 daqiqa mashq qilsangiz, 3 oy ichida ravon gaplasha boshlaysiz!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 28 },
    greeting: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    userName: { fontSize: 26, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    logoBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    logoText: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: "#fff" },
    sectionTitle: { fontSize: 13, fontFamily: "DM_Sans_600SemiBold", color: colors.mutedForeground, letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 20, marginBottom: 12 },
    card: {
      flexDirection: "row", alignItems: "center", gap: 14,
      backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12,
      borderRadius: colors.radius, padding: 16,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    flagBox: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    flag: { fontSize: 28 },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
    tutorName: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    langName: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: colors.primary, marginBottom: 4 },
    desc: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeActive: { backgroundColor: colors.success + "22" },
    badgeFree: { backgroundColor: colors.primary + "22" },
    badgeLocked: { backgroundColor: colors.muted },
    badgeText: { fontSize: 11, fontFamily: "DM_Sans_600SemiBold" },
    tipBox: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 8, backgroundColor: colors.accent + "18", borderRadius: colors.radius, padding: 16, alignItems: "flex-start" },
    tipText: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular", lineHeight: 20 },
  });
