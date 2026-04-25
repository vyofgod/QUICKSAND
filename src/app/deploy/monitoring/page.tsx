"use client";

import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { DeploymentStatus } from "@/lib/db-schema";

export default function MonitoringPage() {
  const { data: overview, isLoading, refetch } = api.deploy.monitoring.overview.useQuery(undefined, { refetchInterval: 30000 });
  const { data: recentDeploys = [] } = api.deploy.monitoring.recentDeployments.useQuery({ limit: 10 }, { refetchInterval: 30000 });
  const { data: projectStatuses = [] } = api.deploy.monitoring.projectStatuses.useQuery(undefined, { refetchInterval: 30000 });

  const statusColors: Record<string, string> = {
    running: "bg-green-500", stopped: "bg-zinc-500",
    error: "bg-red-500", building: "bg-blue-500 animate-pulse", idle: "bg-zinc-600",
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Monitoring</h1>
            <p className="text-sm text-zinc-400">Real-time infrastructure and application monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live · updates every 30s
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total Projects", value: overview?.totalProjects ?? 0, icon: Activity, color: "text-violet-400" },
                { label: "Running", value: overview?.runningProjects ?? 0, icon: CheckCircle2, color: "text-green-400" },
                { label: "Errors", value: overview?.errorProjects ?? 0, icon: AlertTriangle, color: "text-red-400" },
                { label: "Deployments Today", value: overview?.deploymentsToday ?? 0, icon: Clock, color: "text-blue-400" },
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

            {/* Failed deployments warning */}
            {(overview?.failedToday ?? 0) > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">
                    {overview?.failedToday} failed deployment{(overview?.failedToday ?? 0) > 1 ? "s" : ""} in the last 24 hours
                  </p>
                </div>
              </div>
            )}

            {/* Project status table */}
            {projectStatuses.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="border-b border-zinc-800 px-5 py-3">
                  <h2 className="text-sm font-semibold text-zinc-300">Project Status</h2>
                </div>
                {projectStatuses.map((project, idx) => (
                  <div key={String(project.id)} className={cn("flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/50", idx !== projectStatuses.length - 1 && "border-b border-zinc-800")}>
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusColors[project.status] ?? "bg-zinc-600")} />
                    <span className="font-medium text-zinc-100 flex-1">{project.name}</span>
                    <span className={cn("text-xs capitalize",
                      project.status === "running" ? "text-green-400"
                      : project.status === "error" ? "text-red-400"
                      : project.status === "building" ? "text-blue-400"
                      : "text-zinc-400")}>
                      {project.status}
                    </span>
                    {project.url && (
                      <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-zinc-600 hover:text-violet-400 font-mono">{project.url}</a>
                    )}
                    {project.lastDeployedAt && (
                      <span className="text-xs text-zinc-600 shrink-0">
                        {new Date(project.lastDeployedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recent deployments */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="border-b border-zinc-800 px-5 py-3">
                <h2 className="text-sm font-semibold text-zinc-300">Recent Deployments</h2>
              </div>
              {recentDeploys.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-sm">No deployments yet</div>
              ) : (
                recentDeploys.map((dep, idx) => (
                  <div key={String(dep.id)} className={cn("flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50", idx !== recentDeploys.length - 1 && "border-b border-zinc-800")}>
                    {dep.status === DeploymentStatus.SUCCESS ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    ) : dep.status === DeploymentStatus.FAILED ? (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    ) : dep.status === DeploymentStatus.BUILDING ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-200 font-mono">{dep.branch}</span>
                        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 capitalize">{dep.environment}</Badge>
                      </div>
                      {dep.commit && <p className="text-xs text-zinc-600 font-mono mt-0.5">{String(dep.commit).slice(0, 12)}</p>}
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{new Date(dep.createdAt).toLocaleString()}</span>
                    {dep.buildDuration && (
                      <span className="text-xs text-zinc-600 shrink-0">{dep.buildDuration}s</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {projectStatuses.length === 0 && recentDeploys.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
                <Activity className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
                <p className="text-zinc-400 font-medium">No data to monitor yet</p>
                <p className="text-xs text-zinc-600 mt-1">Create and deploy a project to see monitoring data here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
