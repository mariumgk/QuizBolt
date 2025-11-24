"use client";

import { useQuizBoltStore } from "@/lib/store";

export default function SettingsPage() {
  const { theme, setTheme, notificationsEnabled, setNotifications } =
    useQuizBoltStore();

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control appearance and notification preferences.
        </p>
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-4 text-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium">Theme</p>
          <div className="flex gap-3 text-xs">
            {(["light", "dark", "system"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`rounded border px-2 py-1 ${
                  theme === mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-background"
                }`}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Notifications</span>
          <label className="flex items-center gap-2">
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
