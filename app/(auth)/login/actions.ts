"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";

export type LoginFormValues = {
  email: string;
  password: string;
};

export async function loginAction(values: LoginFormValues) {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/dashboard");
}
