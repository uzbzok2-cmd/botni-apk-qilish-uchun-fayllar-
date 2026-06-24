import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { apiSubmitPayment } from "@/lib/api";

const CARD_NUMBER = "9860 3501 4197 4070";

const TYPE_INFO: Record<string, { label: string; price: string; amount: number; icon: string }> = {
  tutor: { label: "Ustoz obunasi (1 hafta)", price: "7 000 UZS", amount: 7000, icon: "chatbubble-ellipses" },
  ielts: { label: "IELTS Mock Exam", price: "28 000 UZS", amount: 28000, icon: "document-text" },
  cert: { label: "Rus tili sertifikati", price: "28 000 UZS", amount: 28000, icon: "ribbon" },
};

const LANG_LABELS: Record<string, string> = { russian: "Ruscha", english: "Inglizcha", turkish: "Turkcha" };

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { payType = "tutor", language = "", level = "" } = useLocalSearchParams<{ payType: string; language?: string; level?: string }>();
  const { userId, user } = useUser();

  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const info = TYPE_INFO[payType] ?? TYPE_INFO.tutor;
  const label = payType === "tutor" && language
    ? `${info.label} (${LANG_LABELS[language] ?? language})`
    : payType === "cert" && level
    ? `${info.label} (${level.toUpperCase()})`
    : info.label;

  const s = styles(colors);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Galereyaga kirishga ruxsat bering"); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, base64: `data:image/jpeg;base64,${asset.base64}` });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const submit = async () => {
    if (!image) { Alert.alert("Chek tasviri kerak", "Iltimos, to'lov chekini yuklang"); return; }
    if (!userId) { Alert.alert("Xato", "Foydalanuvchi aniqlanmadi"); return; }
    setLoading(true);
    try {
      await apiSubmitPayment(
        userId,
        user?.full_name ?? "Mobile User",
        payType,
        language || null,
        level || null,
        image.base64
      );
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      Alert.alert("Xato", e instanceof Error ? e.message : "Yuborishda xato");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[s.successScreen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={s.successIcon}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>
        <Text style={s.successTitle}>To'lov yuborildi!</Text>
        <Text style={s.successText}>
          Admin 24 soat ichida tasdiqlaydi. Tasdiqlangandan so'ng{"\n"}xizmat avtomatik faollashadi.
        </Text>
        <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
          <Text style={s.doneBtnText}>Yopish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>To'lov</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Product info */}
      <View style={[s.card, { margin: 16 }]}>
        <View style={s.productRow}>
          <View style={[s.productIcon, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name={info.icon as "chatbubble-ellipses"} size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.productLabel}>{label}</Text>
            <Text style={s.productPrice}>{info.price}</Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <Text style={s.sectionTitle}>To'lov ko'rsatmasi</Text>
      <View style={[s.card, { marginHorizontal: 16, marginBottom: 16 }]}>
        {[
          { n: "1", text: "Quyidagi karta raqamiga pul o'tkazing:" },
          { n: "2", text: "To'lov skrinshotini yoki chekini yuklang" },
          { n: "3", text: "Yuborish tugmasini bosing" },
        ].map((step) => (
          <View key={step.n} style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{step.n}</Text></View>
            <Text style={s.stepText}>{step.text}</Text>
          </View>
        ))}

        {/* Card number */}
        <View style={s.cardBox}>
          <Ionicons name="card" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Karta raqami</Text>
            <Text style={s.cardNumber}>{CARD_NUMBER}</Text>
          </View>
          <Text style={s.amount}>{info.price}</Text>
        </View>
      </View>

      {/* Image upload */}
      <Text style={s.sectionTitle}>To'lov cheki</Text>
      <TouchableOpacity style={[s.uploadBox, { marginHorizontal: 16, marginBottom: 24 }]} onPress={pickImage} activeOpacity={0.8}>
        {image ? (
          <View>
            <Image source={{ uri: image.uri }} style={s.previewImg} resizeMode="cover" />
            <View style={s.changeOverlay}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={s.changeText}>O'zgartirish</Text>
            </View>
          </View>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
            <Text style={s.uploadTitle}>Chekni yuklang</Text>
            <Text style={s.uploadSubtitle}>Galereyadan rasm tanlang</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.submitBtn, { marginHorizontal: 16 }, (!image || loading) && { opacity: 0.6 }]}
        onPress={submit}
        disabled={!image || loading}
      >
        {loading ? <ActivityIndicator color="#fff" size="small" /> : (
          <>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={s.submitText}>Yuborish</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    successScreen: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 32 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: 24 },
    successTitle: { fontSize: 26, fontFamily: "DM_Sans_700Bold", color: colors.foreground, marginBottom: 12, textAlign: "center" },
    successText: { fontSize: 15, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", textAlign: "center", lineHeight: 24, marginBottom: 40 },
    doneBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingHorizontal: 48, paddingVertical: 16 },
    doneBtnText: { color: "#fff", fontSize: 17, fontFamily: "DM_Sans_700Bold" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 16 },
    sectionTitle: { fontSize: 13, fontFamily: "DM_Sans_600SemiBold", color: colors.mutedForeground, letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },
    productRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    productIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    productLabel: { fontSize: 16, fontFamily: "DM_Sans_600SemiBold", color: colors.foreground, marginBottom: 4 },
    productPrice: { fontSize: 20, fontFamily: "DM_Sans_700Bold", color: colors.primary },
    stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
    stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    stepNumText: { color: "#fff", fontSize: 13, fontFamily: "DM_Sans_700Bold" },
    stepText: { flex: 1, fontSize: 14, color: colors.foreground, fontFamily: "DM_Sans_400Regular", paddingTop: 2 },
    cardBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.muted, borderRadius: 12, padding: 14, marginTop: 8 },
    cardLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    cardNumber: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: colors.foreground, letterSpacing: 2 },
    amount: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: colors.accent },
    uploadBox: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed", minHeight: 160, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    uploadTitle: { fontSize: 16, fontFamily: "DM_Sans_600SemiBold", color: colors.foreground, marginTop: 12 },
    uploadSubtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular", marginTop: 4 },
    previewImg: { width: "100%", height: 200 },
    changeOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
    changeText: { color: "#fff", fontFamily: "DM_Sans_600SemiBold", fontSize: 14 },
    submitBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    submitText: { color: "#fff", fontSize: 17, fontFamily: "DM_Sans_700Bold" },
  });
