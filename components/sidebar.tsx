"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UploadCloud,
  MessageCircle,
  ListChecks,
  LibraryBig,
  StickyNote,
  Sparkles,
  User,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/quizzes", label: "Quizzes", icon: ListChecks },
  { href: "/flashcards", label: "Flashcards", icon: Sparkles },
  { href: "/notes", label: "AI Notes", icon: StickyNote },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 border-r bg-background/80 flex-col py-4 gap-2 text-sm">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "mx-2 flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent transition-colors",
              active && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
