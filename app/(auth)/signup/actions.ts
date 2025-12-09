"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";

export type SignupFormValues = {
  name: string;
  email: string;
  password: string;
};

export async function signupAction(values: SignupFormValues) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { name: values.name },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Signup failed. Please try again." };
  }

  redirect("/dashboard");
}
