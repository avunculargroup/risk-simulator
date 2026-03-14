import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

// Runtime client — transaction mode (port 6543) via pgBouncer
// prepare: false is REQUIRED for pgBouncer compatibility
const queryClient = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 10,
});

export const db = drizzle(queryClient, { schema });

// Server-side Supabase client (uses service role key — bypasses RLS)
// NEVER expose this to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
