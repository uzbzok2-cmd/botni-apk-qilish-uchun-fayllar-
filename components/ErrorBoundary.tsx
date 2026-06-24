import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reloadAppAsync } from "expo";

interface State { hasError: boolean; error: Error | null }

class ErrorBoundaryClass extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }
  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Xatolik yuz berdi</Text>
      <Text style={styles.message}>{error?.message ?? "Noma'lum xatolik"}</Text>
      <TouchableOpacity style={styles.button} onPress={() => reloadAppAsync()}>
        <Text style={styles.buttonText}>Qayta boshlash</Text>
      </TouchableOpacity>
    </View>
  );
}

export default ErrorBoundaryClass;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070B14", alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#F1F5F9", marginBottom: 12 },
  message: { fontSize: 14, color: "#94A3B8", textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: "#4F8EF7", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
