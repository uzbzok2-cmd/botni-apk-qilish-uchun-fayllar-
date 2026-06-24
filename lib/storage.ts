import * as SecureStore from "expo-secure-store";

export async function getStoredUserId(): Promise<number | null> {
  try {
    const v = await SecureStore.getItemAsync("userId");
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

export async function setStoredUserId(id: number): Promise<void> {
  await SecureStore.setItemAsync("userId", String(id));
}

export async function getStoredAdminKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("adminKey");
  } catch {
    return null;
  }
}

export async function setStoredAdminKey(key: string): Promise<void> {
  await SecureStore.setItemAsync("adminKey", key);
}

export async function clearStoredAdminKey(): Promise<void> {
  await SecureStore.deleteItemAsync("adminKey");
}

export async function clearAll(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync("userId"),
    SecureStore.deleteItemAsync("adminKey"),
  ]);
}

export function generateUserId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}
