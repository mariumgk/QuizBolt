import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface QuizBoltState {
  profile: UserProfile | null;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  isAuthenticated: boolean;
  setProfile: (profile: UserProfile | null) => void;
  setTheme: (mode: ThemeMode) => void;
  setNotifications: (value: boolean) => void;
  login: (profile: UserProfile) => void;
  logout: () => void;
}

export const useQuizBoltStore = create<QuizBoltState>((set) => ({
  profile: {
    id: "demo-user",
    name: "Demo Student",
    email: "demo@quizbolt.ai",
  },
  theme: "system",
  notificationsEnabled: true,
  isAuthenticated: false,
  setProfile: (profile) => set({ profile }),
  setTheme: (theme) => set({ theme }),
  setNotifications: (notificationsEnabled) => set({ notificationsEnabled }),
  login: (profile) => set({ profile, isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}));
