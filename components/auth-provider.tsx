"use client";

import { useEffect } from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createClientSupabaseClient } from "@/supabase/client";
import { useQuizBoltStore } from "@/lib/store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { login, logout } = useQuizBoltStore();

    useEffect(() => {
        const supabase = createClientSupabaseClient();

        // Check active session
        supabase.auth.getSession().then(({ data }) => {
            const session = data.session;
            if (session?.user) {
                login({
                    id: session.user.id,
                    email: session.user.email || "",
                    name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
                });
            } else {
                logout();
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                login({
                    id: session.user.id,
                    email: session.user.email || "",
                    name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
                });
            } else {
                logout();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [login, logout]);

    return <>{children}</>;
}
