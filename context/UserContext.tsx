import React, { createContext, useContext, useEffect, useState } from "react";
import { apiGetProfile, MobileUser, ProfileResponse } from "@/lib/api";
import { getStoredUserId, setStoredUserId, generateUserId } from "@/lib/storage";

interface UserContextType {
  userId: number | null;
  user: MobileUser | null;
  subscriptions: Record<string, string | null>;
  freeUsage: { russian: number; english: number; turkish: number };
  isLoading: boolean;
  isRegistered: boolean;
  refresh: () => Promise<void>;
  initUserId: () => Promise<number>;
}

const defaultCtx: UserContextType = {
  userId: null,
  user: null,
  subscriptions: {},
  freeUsage: { russian: 3, english: 3, turkish: 3 },
  isLoading: true,
  isRegistered: false,
  refresh: async () => {},
  initUserId: async () => 0,
};

const UserContext = createContext<UserContextType>(defaultCtx);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [subscriptions, setSubscriptions] = useState<Record<string, string | null>>({});
  const [freeUsage, setFreeUsage] = useState<{ russian: number; english: number; turkish: number }>(
    { russian: 3, english: 3, turkish: 3 }
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const stored = await getStoredUserId();
      if (stored) {
        setUserId(stored);
        await fetchProfile(stored);
      }
    } catch (e) {
      console.error("UserContext load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (id: number) => {
    try {
      const data: ProfileResponse = await apiGetProfile(id);
      setUser(data.user);
      setSubscriptions(data.subscriptions);
      setFreeUsage(data.freeUsage);
    } catch (e) {
      console.error("fetchProfile error:", e);
    }
  };

  const refresh = async () => {
    if (userId) await fetchProfile(userId);
  };

  const initUserId = async (): Promise<number> => {
    let id = await getStoredUserId();
    if (!id) {
      id = generateUserId();
      await setStoredUserId(id);
    }
    setUserId(id);
    return id;
  };

  const isRegistered = !!(user && user.full_name && user.phone_number && user.age && user.gender);

  return (
    <UserContext.Provider value={{ userId, user, subscriptions, freeUsage, isLoading, isRegistered, refresh, initUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
