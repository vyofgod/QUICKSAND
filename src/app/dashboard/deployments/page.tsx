"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  Plus,
  ExternalLink,
  Zap,
  ArrowRight,
} from "lucide-react";
import { DeploymentStatus } from "@/lib/db-schema";

const statusConfig: Record<
  DeploymentStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  [DeploymentStatus.SUCCESS]: {
    label: "Success",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    className: "text-green-600 bg-green-500/10",
  },
  [DeploymentStatus.FAILED]: {
    label: "Failed",
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    className: "text-red-600 bg-red-500/10",
  },
  [DeploymentStatus.BUILDING]: {
    label: "Building",
    icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    className: "text-blue-600 bg-blue-500/10",
  },
  [DeploymentStatus.PENDING]: {
    label: "Pending",
    icon: <Clock className="h-4 w-4 text-yellow-500" />,
    className: "text-yellow-600 bg-yellow-500/10",
  },
  [DeploymentStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4 text-gray-400" />,
    className: "text-gray-500 bg-gray-500/10",
  },
};

export default function DeploymentsPage() {
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | "all">("all");

  const { data: deployments, isLoading } = api.deployment.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: stats } = api.deployment.stats.useQuery();
  const { data: repos } = api.repository.getAll.useQuery({});

  const [deploying, setDeploying] = useState<string | null>(null);
  const utils = api.useUtils();
  const createMutation = api.deployment.create.useMutation({
    onSuccess: () => {
      utils.deployment.list.invalidate();
      utils.deployment.stats.invalidate();
      setDeploying(null);
    },
    onError: () => setDeploying(null),
  });

  const handleDeploy = (repoId: string, branch: string) => {
    setDeploying(repoId);
    createMutation.mutate({ repositoryId: repoId, branch, triggeredBy: "manual" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground">
            Deploy and manage your projects
          </p>
        </div>
        <Link href="/deploy">
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
            <Zap className="h-4 w-4" />
            Open Deploy Platform
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Deploy Platform Banner */}
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-blue-500/10 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
              <Rocket className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">DevDeploy Platform</h2>
              <p className="text-sm text-muted-foreground">
                Full-featured deployment platform — Domains, SSL, Databases, Monitoring, Preview Deployments and more
              </p>
            </div>
          </div>
          <Link href="/deploy">
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shrink-0">
              Launch Platform
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
          {["Custom Domains + SSL", "Preview Deployments", "Database Management", "Real-time Logs & Monitoring"].map((feat) => (
            <div key={feat} className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Rocket className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xl font-bold">{stats?.total ?? 0}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-xl font-bold">{stats?.successful ?? 0}</div>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-xl font-bold">{stats?.failed ?? 0}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-xl font-bold">{stats?.pending ?? 0}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Deploy */}
      {repos && repos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Deploy</CardTitle>
            <CardDescription>Deploy from your repositories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {repos.slice(0, 6).map((repo) => (
                <div
                  key={String(repo.id)}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{repo.name}</p>
                    <p className="text-xs text-muted-foreground">{repo.language}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeploy(String(repo.id), "main")}
                    disabled={deploying === String(repo.id)}
                    className="ml-2 gap-1 shrink-0"
                  >
                    {deploying === String(repo.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Deploy
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter & List */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Deployment History</h2>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DeploymentStatus | "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.values(DeploymentStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {statusConfig[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !deployments || deployments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Rocket className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>No deployments yet. Deploy a project to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {deployments.map((dep) => {
            const config = statusConfig[dep.status];
            return (
              <Card key={String(dep.id)} className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-3 py-3">
                  {config.icon}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{dep.branch}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {dep.environment}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dep.triggeredBy} ·{" "}
                      {new Date(dep.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
                  >
                    {config.label}
                  </span>
                  {dep.url && (
                    <a
                      href={dep.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                  <Link href={`/dashboard/deployments/${String(dep.id)}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
