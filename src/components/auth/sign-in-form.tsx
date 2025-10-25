"use client";

import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signInWithEmail, signInWithOAuth, type OAuthProvider } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState = {
  error: null as string | null,
  success: false
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending magic link..." : "Send magic link"}
    </Button>
  );
}

export function SignInForm() {
  const [state, formAction] = useFormState(signInWithEmail, initialState);
  const [pendingProvider, startTransition] = useTransition();

  const handleOAuth = (provider: OAuthProvider) => {
    startTransition(() => {
      signInWithOAuth(provider).catch((error) => {
        console.error("OAuth sign-in failed", error);
      });
    });
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to Atlas</h1>
        <p className="text-sm text-slate-500">
          Use a magic link or your favorite provider to access your workspace.
        </p>
      </div>
      <form action={formAction} className="mt-8 space-y-4">
        <label className="flex flex-col gap-2 text-left text-sm text-slate-600">
          Email address
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
        {state.success && (
          <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-600">
            Magic link sent! Check your inbox to continue.
          </p>
        )}
        <SubmitButton />
      </form>
      <div className="my-6 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        Or continue with
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["github", "google", "discord"] as OAuthProvider[]).map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingProvider}
            onClick={() => handleOAuth(provider)}
            className={cn("capitalize")}
          >
            {provider}
          </Button>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
