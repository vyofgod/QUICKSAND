"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Rocket, Globe, Activity, Clock, CheckCircle2, XCircle,
  Loader2, ExternalLink, RefreshCw, Settings, Terminal, Key,
  BarChart3, Shield, Pause, RotateCcw, Cpu, HardDrive,
  Network, AlertTriangle, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { toast } from "sonner";
import { DeploymentStatus } from "@/lib/db-schema";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "environment", label: "Environment", icon: Key },
  { id: "logs", label: "Logs", icon: Terminal },
  { id: "monitoring", label: "Monitoring", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const statusColors: Record<string, string> = {
  running: "bg-green-500", stopped: "bg-zinc-500",
  error: "bg-red-500", building: "bg-blue-500 animate-pulse", idle: "bg-zinc-600",
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [newDomain, setNewDomain] = useState("");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newEnvSecret, setNewEnvSecret] = useState(false);
  const [editSettings, setEditSettings] = useState<Record<string, string>>({});

  const utils = api.useUtils();
  const { data: project, isLoading } = api.deploy.project.get.useQuery({ id });
  const { data: deployments = [] } = api.deploy.project.getDeployments.useQuery({ id }, { enabled: activeTab === "deployments" || activeTab === "overview" });
  const { data: domains = [] } = api.deploy.domain.list.useQuery({ projectId: id }, { enabled: activeTab === "domains" });
  const { data: envVars = [] } = api.deploy.envVar.list.useQuery({ projectId: id }, { enabled: activeTab === "environment" });

  const deployMutation = api.deploy.project.deploy.useMutation({
    onSuccess: () => { utils.deploy.project.get.invalidate({ id }); utils.deploy.project.getDeployments.invalidate({ id }); toast.success("Deployment started!"); },
    onError: (e) => toast.error(e.message),
  });
  const stopMutation = api.deploy.project.stop.useMutation({
    onSuccess: () => { utils.deploy.project.get.invalidate({ id }); toast.success("Project stopped"); },
    onError: (e) => toast.error(e.message),
  });
  const addDomainMutation = api.deploy.domain.add.useMutation({
    onSuccess: () => { utils.deploy.domain.list.invalidate({ projectId: id }); setNewDomain(""); toast.success("Domain added"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteDomainMutation = api.deploy.domain.delete.useMutation({
    onSuccess: () => { utils.deploy.domain.list.invalidate({ projectId: id }); toast.success("Domain removed"); },
    onError: (e) => toast.error(e.message),
  });
  const setEnvMutation = api.deploy.envVar.set.useMutation({
    onSuccess: () => { utils.deploy.envVar.list.invalidate({ projectId: id }); setNewEnvKey(""); setNewEnvValue(""); toast.success("Variable saved"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEnvMutation = api.deploy.envVar.delete.useMutation({
    onSuccess: () => { utils.deploy.envVar.list.invalidate({ projectId: id }); toast.success("Variable deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = api.deploy.project.update.useMutation({
    onSuccess: () => { utils.deploy.project.get.invalidate({ id }); toast.success("Settings saved"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-zinc-400 gap-4">
        <p>Project not found.</p>
        <Link href="/deploy"><Button variant="outline" className="border-zinc-700 text-zinc-300">Back to Projects</Button></Link>
      </div>
    );
  }

  const latestDeploy = deployments[0];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/deploy">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2.5">
              <span className={`h-3 w-3 rounded-full ${statusColors[project.status] ?? "bg-zinc-600"}`} />
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              {project.framework && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">{project.framework}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.url && (
              <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />Visit
                </Button>
              </a>
            )}
            <Button
              variant="outline" size="sm"
              className="gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
              onClick={() => stopMutation.mutate({ id })}
              disabled={stopMutation.isPending || project.status === "stopped"}
            >
              <Pause className="h-3.5 w-3.5" />Stop
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs"
              onClick={() => deployMutation.mutate({ id })}
              disabled={deployMutation.isPending}
            >
              {deployMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              Deploy
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Status", value: project.status, icon: CheckCircle2, color: project.status === "running" ? "text-green-400" : "text-zinc-400" },
                { label: "Instances", value: `${project.instances} active`, icon: Cpu, color: "text-blue-400" },
                { label: "Branch", value: project.branch, icon: Activity, color: "text-violet-400" },
                { label: "Region", value: project.region, icon: Globe, color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span className="text-xs text-zinc-500">{s.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-white capitalize">{s.value}</div>
                </div>
              ))}
            </div>

            {latestDeploy && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-4 text-sm font-semibold text-zinc-300">Latest Deployment</h3>
                <div className="flex items-center gap-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", latestDeploy.status === DeploymentStatus.SUCCESS ? "bg-green-500/10" : latestDeploy.status === DeploymentStatus.BUILDING ? "bg-blue-500/10" : "bg-red-500/10")}>
                    {latestDeploy.status === DeploymentStatus.SUCCESS ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : latestDeploy.status === DeploymentStatus.BUILDING ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{latestDeploy.branch} — {latestDeploy.environment}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {latestDeploy.commit ? <span className="font-mono mr-2">{String(latestDeploy.commit).slice(0, 8)}</span> : null}
                      {new Date(latestDeploy.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {latestDeploy.url && (
                    <a href={latestDeploy.url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                      <ExternalLink className="h-4 w-4 text-zinc-500 hover:text-violet-400" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Resource placeholders */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "CPU Usage", value: "—", max: 0, icon: Cpu, color: "bg-blue-500" },
                { label: "Memory", value: "—", max: 0, icon: HardDrive, color: "bg-violet-500" },
                { label: "Network I/O", value: "—", max: 0, icon: Network, color: "bg-green-500" },
              ].map((res) => (
                <div key={res.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <res.icon className="h-4 w-4 text-zinc-400" />
                      <span className="text-xs text-zinc-400">{res.label}</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-500">{res.value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div className={`h-1.5 rounded-full ${res.color} w-0`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Deployments ── */}
        {activeTab === "deployments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-200">Deployment History</h2>
              <Button
                size="sm"
                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs"
                onClick={() => deployMutation.mutate({ id })}
                disabled={deployMutation.isPending}
              >
                {deployMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                New Deployment
              </Button>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              {deployments.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <Rocket className="mx-auto h-8 w-8 mb-3 opacity-30" />
                  <p>No deployments yet. Click &quot;New Deployment&quot; to get started.</p>
                </div>
              ) : (
                deployments.map((dep, idx) => (
                  <div key={String(dep.id)} className={cn("flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50", idx !== deployments.length - 1 && "border-b border-zinc-800")}>
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      dep.status === DeploymentStatus.SUCCESS ? "bg-green-500/10"
                      : dep.status === DeploymentStatus.BUILDING ? "bg-blue-500/10"
                      : dep.status === DeploymentStatus.FAILED ? "bg-red-500/10"
                      : "bg-zinc-800")}>
                      {dep.status === DeploymentStatus.SUCCESS ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                        : dep.status === DeploymentStatus.BUILDING ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        : dep.status === DeploymentStatus.FAILED ? <XCircle className="h-4 w-4 text-red-400" />
                        : <Clock className="h-4 w-4 text-zinc-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-100 capitalize">{dep.environment}</p>
                        {idx === 0 && dep.status === DeploymentStatus.SUCCESS && (
                          <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/5">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {dep.commit && <span className="font-mono mr-2">{String(dep.commit).slice(0, 8)}</span>}
                        {dep.branch} · {new Date(dep.createdAt).toLocaleString()}
                        {dep.buildDuration && ` · ${dep.buildDuration}s`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {dep.url && (
                        <a href={dep.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-200">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                        onClick={() => deployMutation.mutate({ id, branch: dep.branch, environment: dep.environment })}>
                        <RotateCcw className="h-3 w-3" />Redeploy
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Domains ── */}
        {activeTab === "domains" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-200">Domains &amp; SSL</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              {domains.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">No domains configured</div>
              ) : (
                domains.map((d, idx) => (
                  <div key={String(d.id)} className={cn("flex items-center gap-4 px-5 py-4", idx !== domains.length - 1 && "border-b border-zinc-800")}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                      <Globe className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-zinc-100">{d.domain}</span>
                        {d.primary && <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400 bg-violet-500/5">Primary</Badge>}
                        {d.domainType === "auto" && <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">Auto</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Shield className={`h-3 w-3 ${d.ssl ? "text-green-400" : "text-zinc-600"}`} />
                          <span className={`text-xs ${d.ssl ? "text-green-400" : "text-zinc-500"}`}>{d.ssl ? "SSL Active" : "No SSL"}</span>
                        </div>
                        <span className={`text-xs capitalize ${d.status === "active" ? "text-green-400" : d.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>{d.status}</span>
                      </div>
                    </div>
                    {!d.primary && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/60 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteDomainMutation.mutate({ id: String(d.id) })}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <p className="text-sm font-medium text-zinc-300">Add Custom Domain</p>
              <div className="flex gap-2">
                <input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="myapp.example.com"
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                />
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white text-sm"
                  disabled={!newDomain.trim() || addDomainMutation.isPending}
                  onClick={() => addDomainMutation.mutate({ projectId: id, domain: newDomain.trim() })}
                >
                  {addDomainMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-300">DNS Configuration</p>
                  <p className="text-xs text-amber-400/70 mt-1">Point your domain to:</p>
                  <div className="mt-2 space-y-1.5">
                    {[{ type: "A", name: "@", value: "76.76.21.21" }, { type: "CNAME", name: "www", value: "cname.devdeploy.app" }].map((r) => (
                      <div key={r.type} className="flex items-center gap-3 rounded-lg bg-zinc-900 px-3 py-2 font-mono text-xs">
                        <span className="w-12 text-zinc-500">{r.type}</span>
                        <span className="w-12 text-zinc-300">{r.name}</span>
                        <span className="text-zinc-200">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Environment ── */}
        {activeTab === "environment" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-200">Environment Variables</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              {envVars.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">No environment variables set</div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-0 border-b border-zinc-800 px-5 py-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Key</span>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Value</span>
                    <span className="w-8" />
                  </div>
                  {envVars.map((env, idx) => (
                    <div key={String(env.id)} className={cn("grid grid-cols-[1fr_1fr_auto] items-center gap-0 px-5 py-3 hover:bg-zinc-800/50", idx !== envVars.length - 1 && "border-b border-zinc-800")}>
                      <span className="font-mono text-sm text-violet-300">{env.key}</span>
                      <span className={cn("font-mono text-sm truncate pr-4", env.secret ? "text-zinc-600" : "text-zinc-300")}>
                        {env.secret ? "••••••••" : env.value}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-red-400"
                        onClick={() => deleteEnvMutation.mutate({ id: String(env.id) })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <p className="text-xs font-medium text-zinc-400">Add Variable</p>
              <div className="flex gap-2">
                <input
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                  placeholder="KEY"
                  className="w-40 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                />
                <input
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  placeholder="VALUE"
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                />
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={newEnvSecret}
                    onChange={(e) => setNewEnvSecret(e.target.checked)}
                    className="rounded"
                  />
                  Secret
                </label>
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4"
                  disabled={!newEnvKey.trim() || setEnvMutation.isPending}
                  onClick={() => setEnvMutation.mutate({ projectId: id, key: newEnvKey.trim(), value: newEnvValue, secret: newEnvSecret })}
                >
                  {setEnvMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Logs ── */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-200">Build Logs</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
                <span className={cn("h-3 w-3 rounded-full", deployments[0]?.status === DeploymentStatus.SUCCESS ? "bg-green-500" : "bg-zinc-600")} />
                <span className="text-xs text-zinc-400">
                  {deployments[0] ? `Deployment ${String(deployments[0].commit ?? "—").slice(0, 8)} · ${new Date(deployments[0].createdAt).toLocaleString()}` : "No deployments yet"}
                </span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                {deployments[0]?.logs || "No logs available. Deploy the project to see build logs."}
              </pre>
            </div>
          </div>
        )}

        {/* ── Monitoring ── */}
        {activeTab === "monitoring" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-200">Resource Monitoring</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">Metrics Coming Soon</p>
              <p className="text-xs text-zinc-600 mt-1">
                Real-time CPU, memory and network metrics will appear here once the project is deployed and running.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Status", value: project.status, color: project.status === "running" ? "text-green-400" : "text-zinc-400" },
                { label: "Instances", value: String(project.instances), color: "text-blue-400" },
                { label: "Port", value: String(project.port), color: "text-violet-400" },
                { label: "Region", value: project.region, color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                  <p className={`text-sm font-semibold capitalize ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === "settings" && (
          <div className="space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold text-zinc-200">Project Settings</h2>

            {[
              {
                title: "General",
                fields: [
                  { label: "Project Name", key: "name", value: project.name },
                  { label: "Description", key: "description", value: project.description ?? "" },
                  { label: "Framework", key: "framework", value: project.framework ?? "" },
                ],
              },
              {
                title: "Build Configuration",
                fields: [
                  { label: "Install Command", key: "installCommand", value: project.installCommand },
                  { label: "Build Command", key: "buildCommand", value: project.buildCommand },
                  { label: "Output Directory", key: "outputDir", value: project.outputDir },
                  { label: "Root Directory", key: "rootDir", value: project.rootDir },
                  { label: "Port", key: "port", value: String(project.port) },
                ],
              },
              {
                title: "Deployment",
                fields: [
                  { label: "Branch", key: "branch", value: project.branch },
                  { label: "Region", key: "region", value: project.region },
                  { label: "Instances", key: "instances", value: String(project.instances) },
                ],
              },
            ].map((section) => (
              <div key={section.title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">{section.title}</h3>
                {section.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs text-zinc-400">{field.label}</label>
                    <input
                      defaultValue={field.value}
                      onChange={(e) => setEditSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                ))}
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    const payload: Record<string, string | number> = {};
                    for (const field of section.fields) {
                      if (editSettings[field.key] !== undefined) {
                        payload[field.key] = field.key === "port" || field.key === "instances"
                          ? parseInt(editSettings[field.key] ?? field.value, 10)
                          : editSettings[field.key] ?? field.value;
                      }
                    }
                    updateMutation.mutate({ id, ...payload as Parameters<typeof updateMutation.mutate>[0] });
                  }}
                >
                  {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                  Save {section.title}
                </Button>
              </div>
            ))}

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Stop Project</p>
                  <p className="text-xs text-zinc-500">Stop all instances</p>
                </div>
                <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs gap-1.5"
                  onClick={() => stopMutation.mutate({ id })}>
                  <Pause className="h-3.5 w-3.5" />Stop
                </Button>
              </div>
              <div className="flex items-center justify-between border-t border-red-500/10 pt-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Delete Project</p>
                  <p className="text-xs text-zinc-500">Permanently delete this project and all data</p>
                </div>
                <Link href="/deploy">
                  <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />Delete
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
