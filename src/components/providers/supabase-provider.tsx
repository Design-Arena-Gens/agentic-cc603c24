"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { type Session, type SupabaseClient } from "@supabase/supabase-js";
import { type ReactNode, useState } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";

interface SupabaseProviderProps {
  initialSession: Session | null;
  children: ReactNode;
}

export function SupabaseProvider({ initialSession, children }: SupabaseProviderProps) {
  const [supabaseClient] = useState<SupabaseClient<Database>>(() =>
    createBrowserSupabaseClient<Database>()
  );

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
