"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  GitCommit,
  BookOpen,
  Github,
  GitlabIcon as Gitlab,
  ExternalLink,
  Activity,
  GitPullRequest,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  progress,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  progress?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { data: profile, isLoading: profileLoading } =
    trpc.user.getProfile.useQuery();
  const { data: stats, isLoading: statsLoading } =
    trpc.user.getProfileStats.useQuery();

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const githubAccount = profile.accounts.find((a) => a.provider === "github");
  const gitlabAccount = profile.accounts.find((a) => a.provider === "gitlab");

  const displayName =
    githubAccount?.providerUsername ||
    gitlabAccount?.providerUsername ||
    profile.name ||
    "User";

  const completionRate =
    stats && stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.image ?? undefined} />
              <AvatarFallback className="text-2xl">
                {displayName?.charAt(0)?.toUpperCase() ??
                  profile.email?.charAt(0)?.toUpperCase() ??
                  "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-bold">{displayName}</h1>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>

              {/* Connected accounts */}
              <div className="flex flex-wrap gap-2">
                {githubAccount && (
                  <a
                    href={`https://github.com/${profile.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Github className="h-3.5 w-3.5" />@{profile.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                )}
                {gitlabAccount && (
                  <a
                    href={`https://gitlab.com/${profile.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Gitlab className="h-3.5 w-3.5" />@{profile.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                )}
                {!githubAccount && !gitlabAccount && (
                  <Badge variant="outline" className="text-muted-foreground">
                    No connected accounts
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tasks"
            value={String(stats.totalTasks)}
            sub={`${stats.completedTasks} completed (${completionRate}%)`}
            icon={CheckCircle2}
            progress={completionRate}
          />
          <StatCard
            title="Total PRs"
            value={String(stats.totalPRs ?? 0)}
            sub="pull requests opened"
            icon={GitPullRequest}
          />
          <StatCard
            title="Repositories"
            value={String(stats.totalRepos)}
            sub="connected repos"
            icon={BookOpen}
          />
          <StatCard
            title="Commits"
            value={String(stats.totalCommits)}
            sub="across all repos"
            icon={GitCommit}
          />
        </div>
      ) : null}

      {/* Recent Activity */}
      {stats && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((item) => (
                <div
                  key={String(item.id)}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {item.source === "GITHUB" ? (
                      <Github className="h-4 w-4" />
                    ) : item.source === "GITLAB" ? (
                      <Gitlab className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.occurredAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No activity state */}
      {stats && stats.recentActivity.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Connect GitHub or GitLab to see your activity here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
