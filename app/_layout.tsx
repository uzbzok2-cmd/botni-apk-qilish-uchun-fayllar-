import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, DM_Sans_400Regular, DM_Sans_500Medium, DM_Sans_600SemiBold, DM_Sans_700Bold } from "@expo-google-fonts/dm-sans";
import { useColorScheme } from "react-native";
import ErrorBoundary from "@/components/ErrorBoundary";
import { UserProvider } from "@/context/UserContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const scheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    DM_Sans_400Regular,
    DM_Sans_500Medium,
    DM_Sans_600SemiBold,
    DM_Sans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <UserProvider>
                <StatusBar style={scheme === "dark" ? "light" : "dark"} />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="register" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="chat/[lang]" options={{ presentation: "card" }} />
                  <Stack.Screen name="exam/ielts" options={{ presentation: "card" }} />
                  <Stack.Screen name="exam/cert" options={{ presentation: "card" }} />
                  <Stack.Screen name="payment" options={{ presentation: "modal" }} />
                  <Stack.Screen name="admin" options={{ presentation: "modal" }} />
                </Stack>
              </UserProvider>
            </ErrorBoundary>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
