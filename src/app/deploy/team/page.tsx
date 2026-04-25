"use client";

import { Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc/client";

const roleColors: Record<string, string> = {
  Owner: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Member: "bg-zinc-700 text-zinc-400 border-zinc-600",
};

export default function TeamPage() {
  const { data: session } = api.user.getProfile.useQuery();

  const members = session ? [
    {
      id: "1",
      name: session.name ?? session.email ?? "You",
      email: session.email ?? "",
      role: "Owner",
      avatar: (session.name ?? session.email ?? "U")[0]?.toUpperCase() ?? "U",
      joined: new Date(session.createdAt ?? new Date()).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    },
  ] : [];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Team</h1>
            <p className="text-sm text-zinc-400">Manage team members and permissions</p>
          </div>
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4" />Invite Member
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {members.map((member, idx) => (
            <div key={member.id} className={`flex items-center gap-4 px-5 py-4 ${idx !== members.length - 1 ? "border-b border-zinc-800" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-semibold">
                {member.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100">{member.name}</span>
                  <Badge variant="outline" className={`text-[10px] ${roleColors[member.role]}`}>{member.role}</Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{member.email}</p>
              </div>
              <span className="text-xs text-zinc-600">Joined {member.joined}</span>
              {member.role !== "Owner" && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-200">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/60 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Role Permissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Permission</th>
                  {["Owner", "Admin", "Member"].map((r) => (
                    <th key={r} className="text-center py-2 px-4 text-zinc-400 font-medium">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { perm: "View deployments", owner: true, admin: true, member: true },
                  { perm: "Create deployments", owner: true, admin: true, member: true },
                  { perm: "Manage domains", owner: true, admin: true, member: false },
                  { perm: "Manage env variables", owner: true, admin: true, member: false },
                  { perm: "Manage servers", owner: true, admin: true, member: false },
                  { perm: "Manage databases", owner: true, admin: true, member: false },
                  { perm: "Manage team", owner: true, admin: false, member: false },
                  { perm: "Delete projects", owner: true, admin: false, member: false },
                ].map((row) => (
                  <tr key={row.perm} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-4 text-zinc-300">{row.perm}</td>
                    {(["owner", "admin", "member"] as const).map((r) => (
                      <td key={r} className="text-center py-2 px-4">
                        {row[r] ? <span className="text-green-400">✓</span> : <span className="text-zinc-700">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
