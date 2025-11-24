"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuizBoltStore } from "@/lib/store";

type FormValues = {
  name: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useQuizBoltStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = (values: FormValues) => {
    login({ id: "user-1", name: values.name, email: values.email });
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Start generating AI-powered quizzes and flashcards.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Your name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <div className="flex gap-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button className="w-full" disabled={isSubmitting}>
            Sign up
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
