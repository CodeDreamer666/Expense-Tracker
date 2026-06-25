import { AppShell } from "@/components/shared/AppShell";
import { requireUser } from "@/lib/require-user";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}
