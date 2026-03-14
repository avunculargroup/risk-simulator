"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bts-bg p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-page-title text-bts-primary">Treasury Risk</h1>
          <p className="mt-1 text-body-sm text-bts-secondary">Sign in to your account</p>
        </div>

        <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-md overflow-hidden">
          <div className="h-0.5 bg-bts-gold" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-body-sm text-bts-loss">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "rounded-md px-4 py-2.5 text-body font-semibold transition-all mt-1",
                isLoading
                  ? "bg-bts-surface-subtle text-bts-tertiary cursor-not-allowed"
                  : "bg-gradient-to-r from-bts-gold-dark to-bts-gold text-[#1A1915] hover:opacity-90 shadow-bts-sm"
              )}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-body-sm text-bts-tertiary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-bts-gold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
