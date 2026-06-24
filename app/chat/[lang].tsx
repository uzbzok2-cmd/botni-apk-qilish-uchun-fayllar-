import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useCallback } from "react";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { apiChat } from "@/lib/api";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const LANG_INFO: Record<string, { name: string; flag: string; speechLang: string }> = {
  russian: { name: "Natasha", flag: "🇷🇺", speechLang: "ru-RU" },
  english: { name: "Emma", flag: "🇬🇧", speechLang: "en-US" },
  turkish: { name: "Aysha", flag: "🇹🇷", speechLang: "tr-TR" },
};

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang } = useLocalSearchParams<{ lang: string }>();
  const { userId, freeUsage, refresh } = useUser();

  const language = lang ?? "russian";
  const info = LANG_INFO[language] ?? LANG_INFO.russian;

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: language === "russian"
        ? "Salom! Men Natasha, sizning rus tili ustovzingizman. Gaplashaylik! Bugun nima haqida suhbatlashmoqchisiz?"
        : language === "english"
        ? "Hello! I'm Emma, your English tutor. Let's practice! What would you like to talk about today?"
        : "Merhaba! Ben Aysha, Türkçe öğretmeninizim. Konuşalım! Bugün ne hakkında konuşmak istersiniz?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState<"normal" | "sarcastic">("normal");
  const [freeLeft, setFreeLeft] = useState<number | null>(freeUsage[language as keyof typeof freeUsage] ?? 3);
  const [speaking, setSpeaking] = useState<string | null>(null);

  const s = styles(colors);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !userId) return;
    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Msg = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [userMsg, ...prev]);
    setLoading(true);

    const history = [...messages].reverse().slice(-10).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await apiChat(userId, language, personality, text, history);
      const botMsg: Msg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.reply,
      };
      setMessages((prev) => [botMsg, ...prev]);
      if (res.freeLeft !== null) setFreeLeft(res.freeLeft);
      await refresh();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Xatolik";
      const errorMsg: Msg = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: errMsg.includes("Obuna")
          ? "Bepul xabarlar tugadi. Obuna olish uchun Imtihon → Tutor bo'limiga o'ting."
          : `Xatolik: ${errMsg}`,
      };
      setMessages((prev) => [errorMsg, ...prev]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, userId, messages, language, personality, refresh]);

  const speakText = (text: string, msgId: string) => {
    if (speaking === msgId) {
      Speech.stop();
      setSpeaking(null);
      return;
    }
    const clean = text.split("---")[0]?.replace(/[❌✅→]/g, "").trim() ?? text;
    Speech.speak(clean, {
      language: info.speechLang,
      onDone: () => setSpeaking(null),
      onStopped: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
    setSpeaking(msgId);
  };

  const renderMsg = ({ item }: { item: Msg }) => {
    const isUser = item.role === "user";
    return (
      <View style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowBot]}>
        {!isUser && (
          <View style={s.avatar}>
            <Text style={{ fontSize: 16 }}>{info.flag}</Text>
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
          <Text style={[s.msgText, isUser ? s.msgTextUser : s.msgTextBot]}>
            {item.content}
          </Text>
          {!isUser && (
            <TouchableOpacity style={s.ttsBtn} onPress={() => speakText(item.content, item.id)}>
              <Ionicons
                name={speaking === item.id ? "stop-circle" : "volume-high"}
                size={16}
                color={speaking === item.id ? colors.accent : colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerFlag}>{info.flag}</Text>
          <View>
            <Text style={s.headerName}>{info.name}</Text>
            {freeLeft !== null && (
              <Text style={s.headerSub}>{freeLeft} ta bepul xabar</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[s.modeBtn, personality === "sarcastic" && s.modeBtnActive]}
          onPress={() => {
            setPersonality((p) => p === "normal" ? "sarcastic" : "normal");
            Haptics.selectionAsync();
          }}
        >
          <Ionicons
            name={personality === "sarcastic" ? "flash" : "happy"}
            size={18}
            color={personality === "sarcastic" ? colors.accent : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMsg}
          inverted
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!messages.length}
          ListHeaderComponent={
            loading ? (
              <View style={s.typingRow}>
                <View style={s.avatar}>
                  <Text style={{ fontSize: 16 }}>{info.flag}</Text>
                </View>
                <View style={[s.bubble, s.bubbleBot, { paddingVertical: 14 }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={language === "russian" ? "Xabar yozing..." : language === "english" ? "Type a message..." : "Mesaj yazın..."}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={Platform.OS === "ios" ? sendMessage : undefined}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 4 },
    headerFlag: { fontSize: 28 },
    headerName: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: colors.foreground },
    headerSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DM_Sans_400Regular" },
    modeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    modeBtnActive: { backgroundColor: colors.accent + "33" },
    msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 },
    msgRowUser: { justifyContent: "flex-end" },
    msgRowBot: { justifyContent: "flex-start" },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleBot: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
    msgText: { fontSize: 15, lineHeight: 22, fontFamily: "DM_Sans_400Regular" },
    msgTextUser: { color: "#fff" },
    msgTextBot: { color: colors.foreground },
    ttsBtn: { marginTop: 6, alignSelf: "flex-end" },
    typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
    inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    input: {
      flex: 1, backgroundColor: colors.muted, borderRadius: 22, paddingHorizontal: 16,
      paddingVertical: 10, fontSize: 15, color: colors.foreground,
      fontFamily: "DM_Sans_400Regular", maxHeight: 120,
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  });
