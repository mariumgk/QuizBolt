"use client";

import { useEffect } from "react";
import { useQuizBoltStore } from "@/lib/store";

export function ThemeWatcher() {
  const { theme } = useQuizBoltStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const resolved = theme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : theme;

    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return null;
}
