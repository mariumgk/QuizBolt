"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuizBoltStore } from "@/lib/store";

const PUBLIC_ROUTES = ["/login", "/signup"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useQuizBoltStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!pathname) return;
    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
    } else if (isAuthenticated && isPublic) {
      router.replace("/dashboard");
    }

    setChecked(true);
  }, [pathname, isAuthenticated, router]);

  if (!checked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
