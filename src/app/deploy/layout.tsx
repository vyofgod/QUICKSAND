import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DeploySidebar } from "@/components/deploy/sidebar";

export default async function DeployLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <DeploySidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
