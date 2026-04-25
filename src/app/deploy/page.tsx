"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import {
  Plus,
  Search,
  Rocket,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  Globe,
  Activity,
  Server,
  Database,
  Package,
  Zap,
  ArrowRight,
  RefreshCw,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { DeployProject } from "@/lib/db-schema";

const statusColors: Record<string, string> = {
  running: "bg-green-500",
  stopped: "bg-zinc-500",
  error: "bg-red-500",
  building: "bg-blue-500 animate-pulse",
  idle: "bg-zinc-600",
};

const statusBadge: Record<string, string> = {
  running: "bg-green-500/10 text-green-400",
  stopped: "bg-zinc-700 text-zinc-400",
  error: "bg-red-500/10 text-red-400",
  building: "bg-blue-500/10 text-blue-400",
  idle: "bg-zinc-800 text-zinc-500",
};

export default function DeployProjectsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const {
    data: projects = [],
    isLoading,
    refetch,
  } = api.deploy.project.list.useQuery();
  const { data: stats } = api.deploy.project.stats.useQuery();

  const utils = api.useUtils();

  const deployMutation = api.deploy.project.deploy.useMutation({
    onSuccess: () => {
      utils.deploy.project.list.invalidate();
      toast.success("Deployment started");
    },
    onError: (e) => toast.error(e.message),
  });
  const stopMutation = api.deploy.project.stop.useMutation({
    onSuccess: () => {
      utils.deploy.project.list.invalidate();
      toast.success("Project stopped");
    },
    onError: (e) => toast.error(e.message),
  });
  const restartMutation = api.deploy.project.restart.useMutation({
    onSuccess: () => {
      utils.deploy.project.list.invalidate();
      toast.success("Project restarted");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = api.deploy.project.delete.useMutation({
    onSuccess: () => {
      utils.deploy.project.list.invalidate();
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (projects as DeployProject[]).filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const platformStats = [
    {
      label: "Total Projects",
      value: stats?.total ?? 0,
      icon: Rocket,
      color: "text-violet-400",
    },
    {
      label: "Running",
      value: stats?.running ?? 0,
      icon: CheckCircle2,
      color: "text-green-400",
    },
    {
      label: "Deployments Today",
      value: stats?.deploymentsToday ?? 0,
      icon: Zap,
      color: "text-blue-400",
    },
    {
      label: "Projects",
      value: projects.length,
      icon: Clock,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Projects</h1>
            <p className="text-sm text-zinc-400">
              Manage and deploy your web applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Link href="/deploy/projects/new">
              <Button className="gap-2 bg-violet-600 text-white hover:bg-violet-700">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {platformStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-zinc-400">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-zinc-700 bg-zinc-900 pl-9 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-1">
            {["all", "running", "building", "stopped", "error"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Projects */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => {
              const pid = String(project.id);
              return (
                <div
                  key={pid}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${statusColors[project.status] ?? "bg-zinc-600"}`}
                      />
                      <div>
                        <Link
                          href={`/deploy/projects/${pid}`}
                          className="font-semibold text-white transition-colors hover:text-violet-400"
                        >
                          {project.name}
                        </Link>
                        {project.description && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 opacity-0 hover:bg-zinc-800 hover:text-zinc-200 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-zinc-700 bg-zinc-900 text-zinc-100"
                      >
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer gap-2 hover:bg-zinc-800"
                        >
                          <Link href={`/deploy/projects/${pid}`}>
                            <Eye className="h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 hover:bg-zinc-800"
                          onClick={() => deployMutation.mutate({ id: pid })}
                        >
                          <Play className="h-4 w-4" />
                          Deploy Now
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 hover:bg-zinc-800"
                          onClick={() => restartMutation.mutate({ id: pid })}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Restart
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 hover:bg-zinc-800"
                          onClick={() => stopMutation.mutate({ id: pid })}
                        >
                          <Pause className="h-4 w-4" />
                          Stop
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-700" />
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 text-red-400 hover:bg-red-500/10"
                          onClick={() => deleteMutation.mutate({ id: pid })}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <GitBranch className="h-3.5 w-3.5 text-zinc-600" />
                      <span>{project.branch}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Zap className="h-3.5 w-3.5 text-zinc-600" />
                      <span>{project.framework ?? "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Activity className="h-3.5 w-3.5 text-zinc-600" />
                      <span>
                        {project.instances} instance
                        {project.instances !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Globe className="h-3.5 w-3.5 text-zinc-600" />
                      <span>{project.region}</span>
                    </div>
                  </div>

                  {project.url && (
                    <div className="mb-3 flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1.5">
                      <Globe className="h-3 w-3 text-zinc-500" />
                      <span className="truncate text-xs text-zinc-300">
                        {project.url}
                      </span>
                      <a
                        href={`https://${project.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto shrink-0"
                      >
                        <ExternalLink className="h-3 w-3 text-zinc-500 hover:text-violet-400" />
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`border-0 px-1.5 text-[10px] capitalize ${statusBadge[project.status] ?? "bg-zinc-800 text-zinc-500"}`}
                    >
                      {project.status}
                    </Badge>
                    <Link href={`/deploy/projects/${pid}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
                      >
                        Manage <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* New Project Card */}
            <Link href="/deploy/projects/new">
              <div className="flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center transition-colors hover:border-violet-500 hover:bg-zinc-900">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                  <Plus className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="font-medium text-zinc-300">New Project</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Deploy from Git, Docker or template
                </p>
              </div>
            </Link>
          </div>
        )}

        {!isLoading && filtered.length === 0 && projects.length > 0 && (
          <div className="py-12 text-center text-zinc-500">
            <p>No projects match your search.</p>
          </div>
        )}

        {/* Quick Access */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              href: "/deploy/databases",
              icon: Database,
              color: "bg-blue-500/10",
              iconColor: "text-blue-400",
              label: "Databases",
              desc: "PostgreSQL, MySQL, Redis, MongoDB",
            },
            {
              href: "/deploy/servers",
              icon: Server,
              color: "bg-green-500/10",
              iconColor: "text-green-400",
              label: "Servers",
              desc: "Manage your infrastructure",
            },
            {
              href: "/deploy/services",
              icon: Package,
              color: "bg-orange-500/10",
              iconColor: "text-orange-400",
              label: "Services",
              desc: "Coming soon",
              comingSoon: true,
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex cursor-pointer items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}
                >
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-200">{item.label}</p>
                    {item.comingSoon && (
                      <Badge
                        variant="outline"
                        className="border-violet-500/30 px-1.5 py-0 text-[9px] text-violet-400"
                      >
                        Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-zinc-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
