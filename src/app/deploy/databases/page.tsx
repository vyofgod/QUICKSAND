"use client";

import { useState } from "react";
import {
  Database, Plus, CheckCircle2, HardDrive, RefreshCw,
  Copy, Eye, EyeOff, Download, Zap, X, Loader2, Terminal, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { toast } from "sonner";

const dbTypes = [
  { id: "PostgreSQL", icon: "🐘", color: "bg-blue-500/10 border-blue-500/20" },
  { id: "MySQL", icon: "🐬", color: "bg-orange-500/10 border-orange-500/20" },
  { id: "Redis", icon: "⚡", color: "bg-red-500/10 border-red-500/20" },
  { id: "MongoDB", icon: "🍃", color: "bg-green-500/10 border-green-500/20" },
  { id: "MariaDB", icon: "🦭", color: "bg-teal-500/10 border-teal-500/20" },
  { id: "ClickHouse", icon: "📊", color: "bg-yellow-500/10 border-yellow-500/20" },
] as const;

type DbType = (typeof dbTypes)[number]["id"];

const defaultForm = { name: "", dbType: "PostgreSQL" as DbType, version: "", dbUser: "admin", dbPassword: "", host: "", serverId: "" };

export default function DatabasesPage() {
  const [showNew, setShowNew] = useState(false);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [activeDb, setActiveDb] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const utils = api.useUtils();
  const { data: databases = [], isLoading, refetch } = api.deploy.database.list.useQuery();
  const { data: stats } = api.deploy.database.stats.useQuery();
  const { data: servers = [] } = api.deploy.server.list.useQuery();

  const createMutation = api.deploy.database.create.useMutation({
    onSuccess: () => {
      utils.deploy.database.list.invalidate();
      utils.deploy.database.stats.invalidate();
      setShowNew(false);
      setForm(defaultForm);
      toast.success("Database created");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = api.deploy.database.delete.useMutation({
    onSuccess: () => { utils.deploy.database.list.invalidate(); utils.deploy.database.stats.invalidate(); toast.success("Database deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const statusMutation = api.deploy.database.updateStatus.useMutation({
    onSuccess: () => { utils.deploy.database.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.name || !form.dbPassword) return toast.error("Name and password are required");
    createMutation.mutate({
      name: form.name,
      dbType: form.dbType,
      version: form.version || undefined,
      dbUser: form.dbUser,
      dbPassword: form.dbPassword,
      host: form.host || undefined,
      serverId: form.serverId || undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Databases</h1>
            <p className="text-sm text-zinc-400">Manage PostgreSQL, MySQL, Redis, MongoDB and more</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" />New Database
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats?.total ?? 0, icon: Database, color: "text-violet-400" },
            { label: "Running", value: stats?.running ?? 0, icon: CheckCircle2, color: "text-green-400" },
            { label: "Stopped", value: (stats?.total ?? 0) - (stats?.running ?? 0), icon: HardDrive, color: "text-zinc-400" },
            { label: "Types", value: new Set(databases.map((d) => d.dbType)).size, icon: Zap, color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
          </div>
        ) : databases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 py-16 text-center">
            <Database className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-zinc-400 font-medium">No databases yet</p>
            <p className="text-xs text-zinc-600 mt-1">Create your first database to get started</p>
            <Button className="mt-4 gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" />New Database
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {databases.map((db) => {
              const dbid = String(db.id);
              const icon = dbTypes.find((t) => t.id === db.dbType)?.icon ?? "🗄️";
              const connUrl =
                db.dbType === "Redis"
                  ? `redis://${db.dbUser}:***@${db.host ?? "localhost"}:${db.port}`
                  : `${db.dbType.toLowerCase()}://${db.dbUser}:***@${db.host ?? "localhost"}:${db.port}/${db.name}`;

              return (
                <div key={dbid} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-800/50"
                    onClick={() => setActiveDb(activeDb === dbid ? null : dbid)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-xl">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100">{db.name}</span>
                        <Badge variant="outline" className={cn("text-[10px] border-0 px-1.5",
                          db.status === "running" ? "bg-green-500/10 text-green-400"
                          : db.status === "stopped" ? "bg-zinc-700 text-zinc-500"
                          : "bg-red-500/10 text-red-400")}>
                          {db.status}
                        </Badge>
                        <span className="text-xs text-zinc-500">{db.dbType}{db.version ? ` ${db.version}` : ""}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Port {db.port} · {db.host ?? "localhost"}
                        {db.lastBackupAt && ` · Last backup: ${new Date(db.lastBackupAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {db.status === "running" ? (
                        <Button size="sm" variant="ghost"
                          className="h-7 text-xs text-zinc-400 hover:text-red-400"
                          onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: dbid, status: "stopped" }); }}>
                          Stop
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost"
                          className="h-7 text-xs text-zinc-400 hover:text-green-400"
                          onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: dbid, status: "running" }); }}>
                          Start
                        </Button>
                      )}
                    </div>
                  </div>

                  {activeDb === dbid && (
                    <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
                      <p className="text-xs font-medium text-zinc-400">Connection Details</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { label: "Host", value: db.host ?? "localhost" },
                          { label: "Port", value: String(db.port) },
                          { label: "User", value: db.dbUser },
                          { label: "Password", value: showPass[dbid] ? db.dbPassword : "••••••••" },
                        ].map((field) => (
                          <div key={field.label} className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2">
                            <span className="text-xs text-zinc-500 w-16 shrink-0">{field.label}</span>
                            <span className="font-mono text-xs text-zinc-200 flex-1">{field.value}</span>
                            {field.label === "Password" ? (
                              <button onClick={() => setShowPass((p) => ({ ...p, [dbid]: !p[dbid] }))}>
                                {showPass[dbid] ? <EyeOff className="h-3.5 w-3.5 text-zinc-500" /> : <Eye className="h-3.5 w-3.5 text-zinc-500" />}
                              </button>
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-300 cursor-pointer"
                                onClick={() => copyToClipboard(field.value)} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2">
                        <span className="text-xs text-zinc-500 shrink-0">URL</span>
                        <span className="font-mono text-xs text-zinc-300 flex-1 truncate">{connUrl}</span>
                        <Copy className="h-3.5 w-3.5 shrink-0 text-zinc-600 hover:text-zinc-300 cursor-pointer"
                          onClick={() => copyToClipboard(connUrl)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs gap-1.5">
                          <Terminal className="h-3.5 w-3.5" />Terminal
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs gap-1.5">
                          <Download className="h-3.5 w-3.5" />Backup Now
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="ml-auto border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs gap-1.5"
                          onClick={() => deleteMutation.mutate({ id: dbid })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Database Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">New Database</h2>
              <button onClick={() => setShowNew(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {dbTypes.map((type) => (
                <button key={type.id} onClick={() => setForm((f) => ({ ...f, dbType: type.id }))}
                  className={cn("flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                    form.dbType === type.id ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 hover:border-zinc-600")}>
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-xs text-zinc-300">{type.id}</span>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { label: "Database Name *", key: "name", placeholder: "prod-postgres", type: "text" },
                { label: "Version", key: "version", placeholder: "16", type: "text" },
                { label: "Username", key: "dbUser", placeholder: "admin", type: "text" },
                { label: "Password *", key: "dbPassword", placeholder: "••••••••", type: "password" },
                { label: "Host (optional)", key: "host", placeholder: "localhost", type: "text" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">{field.label}</Label>
                  <Input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              ))}
              {servers.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Server (optional)</Label>
                  <select
                    value={form.serverId}
                    onChange={(e) => setForm((f) => ({ ...f, serverId: e.target.value }))}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="">No server</option>
                    {servers.map((s) => (
                      <option key={String(s.id)} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" disabled={createMutation.isPending} onClick={handleCreate}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Database
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
