"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import type { Provider } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSiteUrl } from "@/lib/env";

export type OAuthProvider = "github" | "google" | "discord";

export async function signInWithEmail(_: unknown, formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string" || email.length === 0) {
    return { success: false, error: "Please provide a valid email address" } as const;
  }

  const supabase = createServerActionClient<Database>({ cookies });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`
    }
  });

  if (error) {
    return { success: false, error: error.message } as const;
  }

  return { success: true, error: null } as const;
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = createServerActionClient<Database>({ cookies });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`
    }
  });

  if (error) {
    return { error: error.message } as const;
  }

  if (data?.url) {
    redirect(data.url);
  }

  return { error: "Unable to start OAuth flow" } as const;
}
