"use client";

import { useState } from "react";
import {
  Server, Plus, CheckCircle2, AlertTriangle, Terminal,
  RefreshCw, Zap, Globe, Shield, HardDrive, Loader2, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { toast } from "sonner";

const providerColors: Record<string, string> = {
  Hetzner: "text-red-400", DigitalOcean: "text-blue-400",
  Vultr: "text-teal-400", Linode: "text-green-400", AWS: "text-orange-400",
};

const statusBadge: Record<string, string> = {
  online: "bg-green-500/10 text-green-400",
  warning: "bg-yellow-500/10 text-yellow-400",
  offline: "bg-red-500/10 text-red-400",
};

const defaultForm = {
  name: "", provider: "Hetzner", location: "", ip: "",
  os: "Ubuntu 22.04 LTS", sshUser: "root", sshPort: "22",
  cpuCores: "", memoryMb: "", diskGb: "",
};

export default function ServersPage() {
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const utils = api.useUtils();
  const { data: servers = [], isLoading, refetch } = api.deploy.server.list.useQuery();

  const createMutation = api.deploy.server.create.useMutation({
    onSuccess: () => {
      utils.deploy.server.list.invalidate();
      setShowAdd(false);
      setForm(defaultForm);
      toast.success("Server added");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = api.deploy.server.delete.useMutation({
    onSuccess: () => { utils.deploy.server.list.invalidate(); toast.success("Server removed"); },
    onError: (e) => toast.error(e.message),
  });

  const stats = {
    total: servers.length,
    online: servers.filter((s) => s.status === "online").length,
    warnings: servers.filter((s) => s.status === "warning").length,
  };

  const handleCreate = () => {
    if (!form.name || !form.ip || !form.location) return toast.error("Name, IP and location are required");
    createMutation.mutate({
      name: form.name,
      provider: form.provider,
      location: form.location,
      ip: form.ip,
      os: form.os || undefined,
      sshUser: form.sshUser || undefined,
      sshPort: form.sshPort ? parseInt(form.sshPort, 10) : undefined,
      cpuCores: form.cpuCores ? parseInt(form.cpuCores, 10) : undefined,
      memoryMb: form.memoryMb ? parseInt(form.memoryMb, 10) : undefined,
      diskGb: form.diskGb ? parseInt(form.diskGb, 10) : undefined,
    });
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Servers</h1>
            <p className="text-sm text-zinc-400">Manage your infrastructure nodes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />Add Server
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Servers", value: stats.total, icon: Server, color: "text-violet-400" },
            { label: "Online", value: stats.online, icon: CheckCircle2, color: "text-green-400" },
            { label: "Warnings", value: stats.warnings, icon: AlertTriangle, color: "text-yellow-400" },
            { label: "Offline", value: servers.filter((s) => s.status === "offline").length, icon: Zap, color: "text-red-400" },
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

        {/* Server list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
          </div>
        ) : servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 py-16 text-center">
            <Server className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-zinc-400 font-medium">No servers added yet</p>
            <p className="text-xs text-zinc-600 mt-1">Add your first server to start deploying</p>
            <Button className="mt-4 gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />Add Server
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => {
              const sid = String(server.id);
              return (
                <div key={sid} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-800/50"
                    onClick={() => setActiveServer(activeServer === sid ? null : sid)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                      <Server className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100">{server.name}</span>
                        <Badge variant="outline" className={cn("text-[10px] border-0 px-1.5", statusBadge[server.status])}>
                          {server.status}
                        </Badge>
                        <span className={`text-xs ${providerColors[server.provider] ?? "text-zinc-400"}`}>{server.provider}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        <span className="flex items-center gap-1 inline-flex"><Globe className="h-3 w-3" />{server.location}</span>
                        {" · "}
                        <span className="font-mono">{server.ip}</span>
                        {server.os && ` · ${server.os}`}
                        {server.uptime && ` · Uptime: ${server.uptime}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                      {server.cpuCores && <div className="text-right"><p className="text-zinc-200 font-medium">{server.cpuCores} vCPU</p><p className="text-zinc-600">CPU</p></div>}
                      {server.memoryMb && <div className="text-right"><p className="text-zinc-200 font-medium">{Math.round(server.memoryMb / 1024 * 10) / 10} GB</p><p className="text-zinc-600">RAM</p></div>}
                      {server.diskGb && <div className="text-right"><p className="text-zinc-200 font-medium">{server.diskGb} GB</p><p className="text-zinc-600">Disk</p></div>}
                    </div>
                  </div>

                  {activeServer === sid && (
                    <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        {[
                          { label: "SSH User", value: server.sshUser ?? "root" },
                          { label: "SSH Port", value: String(server.sshPort ?? 22) },
                          { label: "OS", value: server.os ?? "Unknown" },
                          { label: "IP", value: server.ip },
                        ].map((info) => (
                          <div key={info.label} className="rounded-lg bg-zinc-800 px-3 py-2">
                            <p className="text-zinc-500 mb-0.5">{info.label}</p>
                            <p className="text-zinc-200 font-mono">{info.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs gap-1.5">
                          <Terminal className="h-3.5 w-3.5" />SSH Terminal
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5" />Restart
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs gap-1.5">
                          <Shield className="h-3.5 w-3.5" />Firewall
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs gap-1.5">
                          <HardDrive className="h-3.5 w-3.5" />Volumes
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="ml-auto border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs gap-1.5"
                          onClick={() => deleteMutation.mutate({ id: sid })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick add providers */}
        {!showAdd && (
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-3">Connect a new server</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { name: "Hetzner", color: "text-red-400", desc: "Best price/performance" },
                { name: "DigitalOcean", color: "text-blue-400", desc: "Simple & reliable" },
                { name: "AWS EC2", color: "text-orange-400", desc: "Flexible & powerful" },
                { name: "Custom SSH", color: "text-zinc-400", desc: "Any server via SSH" },
              ].map((p) => (
                <button key={p.name} onClick={() => { setForm((f) => ({ ...f, provider: p.name })); setShowAdd(true); }}
                  className="flex flex-col items-start rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-left hover:border-zinc-500 transition-colors">
                  <span className={`text-sm font-medium ${p.color}`}>{p.name}</span>
                  <span className="text-xs text-zinc-600 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Server Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Add Server</h2>
              <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Server Name *", key: "name", placeholder: "prod-eu-01" },
                { label: "IP Address *", key: "ip", placeholder: "192.168.1.100" },
                { label: "Location *", key: "location", placeholder: "Frankfurt, DE" },
                { label: "Provider", key: "provider", placeholder: "Hetzner" },
                { label: "Operating System", key: "os", placeholder: "Ubuntu 22.04" },
                { label: "SSH User", key: "sshUser", placeholder: "root" },
                { label: "SSH Port", key: "sshPort", placeholder: "22" },
                { label: "CPU Cores", key: "cpuCores", placeholder: "4" },
                { label: "Memory (MB)", key: "memoryMb", placeholder: "8192" },
                { label: "Disk (GB)", key: "diskGb", placeholder: "80" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">{field.label}</Label>
                  <Input
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={createMutation.isPending}
                onClick={handleCreate}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Server
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
