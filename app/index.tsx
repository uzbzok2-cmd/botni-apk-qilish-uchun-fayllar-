import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const colors = useColors();
  const { userId, isRegistered, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!userId || !isRegistered) {
      router.replace("/register");
    } else {
      router.replace("/(tabs)");
    }
  }, [isLoading, userId, isRegistered]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
