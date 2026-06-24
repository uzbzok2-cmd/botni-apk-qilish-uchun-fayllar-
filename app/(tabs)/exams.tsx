import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";

const EXAMS = [
  {
    id: "ielts",
    title: "IELTS Mock Exam",
    subtitle: "To'liq simulyatsiya",
    icon: "document-text" as const,
    color: "#4F8EF7",
    price: "28 000 UZS",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    duration: "3 soat 30 daqiqa",
    subKey: "ielts_",
    route: "/exam/ielts",
    payType: "ielts",
  },
  {
    id: "cert_b2",
    title: "Rus tili B2",
    subtitle: "Upper-Intermediate",
    icon: "ribbon" as const,
    color: "#22C55E",
    price: "28 000 UZS",
    sections: ["Reading", "Listening", "Grammar", "Writing", "Speaking"],
    duration: "4 soat",
    subKey: "cert_B2",
    route: "/exam/cert?level=B2",
    payType: "cert",
    level: "B2",
  },
  {
    id: "cert_c1",
    title: "Rus tili C1",
    subtitle: "Advanced",
    icon: "trophy" as const,
    color: "#F59E0B",
    price: "28 000 UZS",
    sections: ["Reading", "Listening", "Grammar", "Writing", "Speaking"],
    duration: "4 soat 15 daqiqa",
    subKey: "cert_C1",
    route: "/exam/cert?level=C1",
    payType: "cert",
    level: "C1",
  },
];

export default function ExamsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscriptions, refresh } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const s = styles(colors);

  const getExamStatus = (subKey: string) => {
    if (subscriptions[subKey]) return "purchased";
    return "locked";
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={s.header}>
        <Text style={s.title}>Imtihonlar</Text>
        <Text style={s.subtitle}>Bilimingizni sinab ko'ring</Text>
      </View>

      {EXAMS.map((exam) => {
        const status = getExamStatus(exam.subKey);
        const isPurchased = status === "purchased";
        return (
          <TouchableOpacity
            key={exam.id}
            style={s.card}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (isPurchased) {
                router.push(exam.route as never);
              } else {
                router.push({
                  pathname: "/payment",
                  params: { payType: exam.payType, level: (exam as { level?: string }).level ?? "" },
                });
              }
            }}
          >
            <View style={[s.iconBox, { backgroundColor: exam.color + "22" }]}>
              <Ionicons name={exam.icon} size={28} color={exam.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.cardTop}>
                <Text style={s.examTitle}>{exam.title}</Text>
                {isPurchased && (
                  <View style={s.purchasedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={[s.badgeText, { color: colors.success }]}>Xarid qilingan</Text>
                  </View>
                )}
              </View>
              <Text style={s.examSubtitle}>{exam.subtitle}</Text>
              <View style={s.sectionRow}>
                {exam.sections.map((sec) => (
                  <View key={sec} style={s.secChip}>
                    <Text style={s.secText}>{sec}</Text>
                  </View>
                ))}
              </View>
              <View style={s.footer}>
                <View style={s.footerItem}>
                  <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                  <Text style={s.footerText}>{exam.duration}</Text>
                </View>
                <Text style={[s.price, { color: exam.color }]}>{exam.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={s.infoBox}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <Text style={s.infoText}>
          To'lovdan so'ng admin tasdiqlaydi va 24 soat ichida imtihon faollashadi.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    header: { paddingHorizontal: 20, marginBottom: 24 },
    title: { fontSize: 28, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    card: {
      flexDirection: "row", gap: 14, alignItems: "flex-start",
      backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 14,
      borderRadius: colors.radius, padding: 16,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
    examTitle: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: colors.foreground, flex: 1 },
    examSubtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginBottom: 10 },
    purchasedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.success + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontFamily: "DM_Sans_600SemiBold" },
    sectionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    secChip: { backgroundColor: colors.muted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    secText: { fontSize: 11, color: colors.mutedForeground, fontFamily: "DM_Sans_500Medium" },
    footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    footerText: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    price: { fontSize: 16, fontFamily: "DM_Sans_700Bold" },
    infoBox: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 4, backgroundColor: colors.primaryLight, borderRadius: colors.radius, padding: 14, alignItems: "flex-start" },
    infoText: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "DM_Sans_400Regular", lineHeight: 20 },
  });
