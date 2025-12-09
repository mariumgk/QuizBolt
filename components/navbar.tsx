"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuizBoltStore } from "@/lib/store";
import { createClientSupabaseClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/chat", label: "Chat" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/notes", label: "AI Notes" },
  { href: "/library", label: "Library" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useQuizBoltStore();
  const supabase = createClientSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 border-b bg-background/80 backdrop-blur flex items-center px-4 justify-between">
      <div className="flex items-center gap-2">
        <Image
          src="/quizbolt-logo.png"
          alt="QuizBolt logo"
          width={24}
          height={24}
          className="rounded"
        />
        <span className="font-semibold">QuizBolt</span>
      </div>
      <nav className="hidden md:flex items-center gap-1 text-sm">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname?.startsWith(item.href) ? "default" : "ghost"}
              size="sm"
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button size="sm" type="button">
              Login
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
