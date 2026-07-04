import { getSessionAction } from "@/server/auth";
import { redirect } from "next/navigation";
import { Brain } from "lucide-react";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const { user } = await getSessionAction();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col items-center gap-2 p-6 pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Knot</h1>
            <p className="text-sm text-muted-foreground">
              Enter your passphrase to continue
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
