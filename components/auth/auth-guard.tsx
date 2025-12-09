"use client";

// TEMP: AuthGuard disabled for testing. Always render children.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
