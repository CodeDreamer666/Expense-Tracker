import { AppShell } from "@/components/shared/AppShell";
import { auth } from "@/server/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/login");
    }
    return (
        <AppShell user={session.user}>
            {children}
        </AppShell>
    );
}
