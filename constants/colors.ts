export interface AppColors {
  background: string;
  surface: string;
  card: string;
  primary: string;
  primaryLight: string;
  accent: string;
  foreground: string;
  mutedForeground: string;
  muted: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  tabBar: string;
  radius: number;
}

export const lightColors: AppColors = {
  background: "#EEF2FF",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  accent: "#F59E0B",
  foreground: "#0F172A",
  mutedForeground: "#64748B",
  muted: "#F1F5F9",
  border: "#E2E8F0",
  success: "#16A34A",
  error: "#DC2626",
  warning: "#D97706",
  tabBar: "#FFFFFF",
  radius: 16,
};

export const darkColors: AppColors = {
  background: "#070B14",
  surface: "#0D1526",
  card: "#111E35",
  primary: "#4F8EF7",
  primaryLight: "#162035",
  accent: "#F59E0B",
  foreground: "#F1F5F9",
  mutedForeground: "#94A3B8",
  muted: "#1E293B",
  border: "#1E2D4E",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  tabBar: "#0D1526",
  radius: 16,
};
