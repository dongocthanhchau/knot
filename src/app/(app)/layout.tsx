import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  if (!user) redirect("/login");

  return (
    <div data-astryx-theme="neutral">
      <AppShell>{children}</AppShell>
    </div>
  );
}
