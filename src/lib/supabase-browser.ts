"use client";

import { createClient } from "@supabase/supabase-js";

// Browser-safe Supabase client — uses anon key, respects RLS
// Use this in client components and hooks for Realtime subscriptions
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
