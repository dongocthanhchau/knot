"use client";

import { useActionState } from "react";
import { signInAction } from "@/server/auth";

export default function LoginForm() {
  const [state, formAction] = useActionState(signInAction, { error: null as string | null });

  return (
    <form action={formAction} className="space-y-4 p-6 pt-4">
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      <div className="space-y-2">
        <label
          htmlFor="passphrase"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Passphrase
        </label>
        <input
          id="passphrase"
          type="password"
          name="passphrase"
          placeholder="Enter your passphrase"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          required
          minLength={4}
        />
      </div>
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
      >
        Sign In
      </button>
    </form>
  );
}
