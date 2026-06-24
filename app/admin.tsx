import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiAdminStats, apiAdminPayments, apiConfirmPayment, apiRejectPayment, AdminStats, MobilePayment } from "@/lib/api";
import { getStoredAdminKey, setStoredAdminKey, clearStoredAdminKey } from "@/lib/storage";

type Screen = "login" | "dashboard";

const PAY_TYPE_LABELS: Record<string, string> = {
  tutor: "Ustoz obunasi",
  ielts: "IELTS Exam",
  cert: "Rus sertifikati",
};

const LANG_FLAGS: Record<string, string> = {
  russian: "🇷🇺", english: "🇬🇧", turkish: "🇹🇷",
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("login");
  const [keyInput, setKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payments, setPayments] = useState<MobilePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const s = styles(colors);

  useEffect(() => {
    checkStoredKey();
  }, []);

  const checkStoredKey = async () => {
    const stored = await getStoredAdminKey();
    if (stored) {
      setAdminKey(stored);
      await loadDashboard(stored);
    }
  };

  const login = async () => {
    if (!keyInput.trim()) { setAuthError("Kalit kiriting"); return; }
    setLoading(true);
    try {
      await apiAdminStats(keyInput.trim());
      await setStoredAdminKey(keyInput.trim());
      setAdminKey(keyInput.trim());
      await loadDashboard(keyInput.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreen("dashboard");
    } catch {
      setAuthError("Noto'g'ri kalit. Admin kalitini tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (key: string) => {
    setRefreshing(true);
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        apiAdminStats(key),
        apiAdminPayments(key),
      ]);
      setStats(statsRes.stats);
      setPayments(paymentsRes.payments);
      setScreen("dashboard");
    } catch {
      await clearStoredAdminKey();
      setAdminKey("");
      setScreen("login");
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfirm = async (paymentId: number) => {
    Alert.alert("Tasdiqlash", "Bu to'lovni tasdiqlashni xohlaysizmi? Obuna faollashadi.", [
      { text: "Bekor", style: "cancel" },
      {
        text: "Tasdiqlash",
        onPress: async () => {
          setConfirmingId(paymentId);
          try {
            await apiConfirmPayment(paymentId, adminKey);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPayments((p) => p.filter((x) => x.id !== paymentId));
            setStats((s) => s ? { ...s, pendingPayments: Math.max(0, s.pendingPayments - 1), confirmedToday: s.confirmedToday + 1 } : s);
          } catch {
            Alert.alert("Xato", "Tasdiqlashda xato");
          } finally {
            setConfirmingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (paymentId: number) => {
    Alert.alert("Rad etish", "Bu to'lovni rad etishni xohlaysizmi?", [
      { text: "Bekor", style: "cancel" },
      {
        text: "Rad etish",
        style: "destructive",
        onPress: async () => {
          setConfirmingId(paymentId);
          try {
            await apiRejectPayment(paymentId, adminKey);
            setPayments((p) => p.filter((x) => x.id !== paymentId));
            setStats((s) => s ? { ...s, pendingPayments: Math.max(0, s.pendingPayments - 1) } : s);
          } catch {
            Alert.alert("Xato", "Rad etishda xato");
          } finally {
            setConfirmingId(null);
          }
        },
      },
    ]);
  };

  const logout = async () => {
    await clearStoredAdminKey();
    setAdminKey("");
    setScreen("login");
    setKeyInput("");
  };

  if (screen === "login") {
    return (
      <View style={[s.loginScreen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { alignSelf: "flex-start" }]}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.loginIcon}>
          <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
        </View>
        <Text style={s.loginTitle}>Admin Panel</Text>
        <Text style={s.loginSubtitle}>Admin kalitini kiriting</Text>
        <TextInput
          style={s.keyInput}
          value={keyInput}
          onChangeText={(v) => { setKeyInput(v); setAuthError(""); }}
          placeholder="Admin kalit..."
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          autoFocus
          returnKeyType="done"
          onSubmitEditing={login}
        />
        {!!authError && <Text style={s.authError}>{authError}</Text>}
        <TouchableOpacity style={[s.loginBtn, loading && { opacity: 0.6 }]} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.loginBtnText}>Kirish</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Stats */}
        {stats && (
          <View style={s.statsGrid}>
            {[
              { label: "Foydalanuvchilar", value: stats.totalUsers, icon: "people", color: colors.primary },
              { label: "Faol obunalar", value: stats.activeSubscriptions, icon: "checkmark-circle", color: colors.success },
              { label: "Kutilayotgan", value: stats.pendingPayments, icon: "time", color: colors.warning },
              { label: "Bugun tasdiqlandi", value: stats.confirmedToday, icon: "cash", color: colors.accent },
            ].map((item) => (
              <View key={item.label} style={s.statCard}>
                <Ionicons name={item.icon as "people"} size={22} color={item.color} />
                <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Refresh */}
        <TouchableOpacity style={s.refreshBtn} onPress={() => loadDashboard(adminKey)} disabled={refreshing}>
          {refreshing ? <ActivityIndicator size="small" color={colors.primary} /> : (
            <>
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={s.refreshText}>Yangilash</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Pending payments */}
        <Text style={s.sectionTitle}>
          Kutilayotgan to'lovlar ({payments.length})
        </Text>

        {payments.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="checkmark-done-circle" size={40} color={colors.success} />
            <Text style={s.emptyText}>Hamma to'lovlar ko'rib chiqilgan</Text>
          </View>
        ) : (
          payments.map((p) => (
            <View key={p.id} style={[s.payCard, { marginHorizontal: 16, marginBottom: 12 }]}>
              {/* User info */}
              <View style={s.payHeader}>
                <View style={s.payAvatarBox}>
                  <Text style={s.payAvatar}>{(p.user_name ?? "?")[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.payUserName}>{p.user_name ?? "Noma'lum"}</Text>
                  <Text style={s.payMeta}>
                    {PAY_TYPE_LABELS[p.pay_type] ?? p.pay_type}
                    {p.language ? ` · ${LANG_FLAGS[p.language] ?? ""} ${p.language}` : ""}
                    {p.level ? ` · ${p.level}` : ""}
                  </Text>
                </View>
                <View style={s.amountBadge}>
                  <Text style={s.amountText}>{(p.amount_uzs ?? 0).toLocaleString()} UZS</Text>
                </View>
              </View>

              {/* Receipt image */}
              {p.receipt_image && (
                <Image
                  source={{ uri: p.receipt_image }}
                  style={s.receiptImg}
                  resizeMode="cover"
                />
              )}

              {/* Date */}
              <Text style={s.payDate}>
                {new Date(p.created_at).toLocaleDateString("uz-UZ")} ·{" "}
                {new Date(p.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
              </Text>

              {/* Actions */}
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.rejectBtn, confirmingId === p.id && { opacity: 0.6 }]}
                  onPress={() => handleReject(p.id)}
                  disabled={confirmingId === p.id}
                >
                  <Ionicons name="close" size={18} color={colors.error} />
                  <Text style={[s.actionText, { color: colors.error }]}>Rad etish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.confirmBtn, confirmingId === p.id && { opacity: 0.6 }]}
                  onPress={() => handleConfirm(p.id)}
                  disabled={confirmingId === p.id}
                >
                  {confirmingId === p.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={[s.actionText, { color: "#fff" }]}>Tasdiqlash</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    loginScreen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, alignItems: "center" },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    loginIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginTop: 32, marginBottom: 20 },
    loginTitle: { fontSize: 26, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 6 },
    loginSubtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginBottom: 32 },
    keyInput: { width: "100%", backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: colors.foreground, fontFamily: "DM_Sans_400Regular", marginBottom: 12 },
    authError: { color: colors.error, fontSize: 13, fontFamily: "DM_Sans_400Regular", marginBottom: 12 },
    loginBtn: { width: "100%", backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 16, alignItems: "center" },
    loginBtnText: { color: "#fff", fontSize: 17, fontFamily: "DM_Sans_700Bold" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    logoutBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 10 },
    statCard: { flex: 1, minWidth: "44%", backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 16, alignItems: "center", gap: 6 },
    statValue: { fontSize: 28, fontFamily: "DM_Sans_700Bold" },
    statLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", textAlign: "center" },
    refreshBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, marginHorizontal: 16, marginBottom: 4 },
    refreshText: { fontSize: 14, color: colors.primary, fontFamily: "DM_Sans_600SemiBold" },
    sectionTitle: { fontSize: 13, fontFamily: "DM_Sans_600SemiBold", color: colors.mutedForeground, letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 20, marginBottom: 12 },
    emptyBox: { alignItems: "center", paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 15, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    payCard: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    payHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    payAvatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    payAvatar: { color: "#fff", fontSize: 18, fontFamily: "DM_Sans_700Bold" },
    payUserName: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: colors.foreground },
    payMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginTop: 2 },
    amountBadge: { backgroundColor: colors.accent + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    amountText: { fontSize: 13, fontFamily: "DM_Sans_700Bold", color: colors.accent },
    receiptImg: { width: "100%", height: 180, backgroundColor: colors.muted },
    payDate: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", paddingHorizontal: 14, paddingVertical: 8 },
    actionRow: { flexDirection: "row", gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
    rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.error },
    confirmBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.success },
    actionText: { fontSize: 14, fontFamily: "DM_Sans_700Bold" },
  });
