"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitBranch,
  GitCommit,
  Star,
  GitFork,
  AlertCircle,
  RefreshCw,
  Github,
  GitlabIcon as GitLab,
  ExternalLink,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function extractRepoId(id: unknown): string {
  const str = String(id);
  if (str.includes(":")) return str.split(":").slice(1).join(":");
  return str;
}

export default function RepositoriesPage() {
  const [selectedProvider, setSelectedProvider] = useState<
    "all" | "GITHUB" | "GITLAB"
  >("all");
  const [includeArchived, setIncludeArchived] = useState(false);

  const {
    data: repositories,
    isLoading,
    refetch,
  } = trpc.repository.getAll.useQuery({
    provider: selectedProvider === "all" ? undefined : (selectedProvider as import("@/lib/db-schema").ActivitySource),
    includeArchived,
  });

  // Stats'ı lazy load et - sadece gerektiğinde yükle
  const { data: stats } = trpc.repository.getStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  });

  const syncAllMutation = trpc.repository.syncAll.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Sync completed! Added: ${result.repositoriesAdded}, Updated: ${result.repositoriesUpdated}`
      );
      if (result.errors.length > 0) {
        toast.error(`Errors: ${result.errors.join(", ")}`);
      }
      refetch();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const syncGitHubMutation = trpc.repository.syncGitHub.useMutation({
    onSuccess: (result) => {
      toast.success(
        `GitHub sync completed! Added: ${result.repositoriesAdded}, Updated: ${result.repositoriesUpdated}`
      );
      refetch();
    },
    onError: (error) => {
      toast.error(`GitHub sync failed: ${error.message}`);
    },
  });

  const syncGitLabMutation = trpc.repository.syncGitLab.useMutation({
    onSuccess: (result) => {
      toast.success(
        `GitLab sync completed! Added: ${result.repositoriesAdded}, Updated: ${result.repositoriesUpdated}`
      );
      refetch();
    },
    onError: (error) => {
      toast.error(`GitLab sync failed: ${error.message}`);
    },
  });

  const isSyncing =
    syncAllMutation.isPending ||
    syncGitHubMutation.isPending ||
    syncGitLabMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="text-muted-foreground">
            Manage and track your GitHub and GitLab repositories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => syncGitHubMutation.mutate()}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            <Github className="mr-2 h-4 w-4" />
            Sync GitHub
          </Button>
          <Button
            onClick={() => syncGitLabMutation.mutate()}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            <GitLab className="mr-2 h-4 w-4" />
            Sync GitLab
          </Button>
          <Button onClick={() => syncAllMutation.mutate()} disabled={isSyncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            Sync All
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Repositories
              </CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRepos}</div>
              <p className="text-xs text-muted-foreground">
                {stats.githubRepos} GitHub, {stats.gitlabRepos} GitLab
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commits
              </CardTitle>
              <GitCommit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCommits}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentCommits} in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Top Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.languageDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([lang, count]) => (
                    <Badge key={lang} variant="secondary">
                      {lang} ({count})
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedProvider === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("all")}
          >
            All
          </Button>
          <Button
            variant={selectedProvider === "GITHUB" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("GITHUB")}
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
          <Button
            variant={selectedProvider === "GITLAB" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("GITLAB")}
          >
            <GitLab className="mr-2 h-4 w-4" />
            GitLab
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIncludeArchived(!includeArchived)}
        >
          <Archive className="mr-2 h-4 w-4" />
          {includeArchived ? "Hide" : "Show"} Archived
        </Button>
      </div>

      {/* Repository List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : repositories && repositories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {repositories.map((repo) => (
            <Card key={repo.id} className={repo.isArchived ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {repo.provider === "GITHUB" ? (
                        <Github className="h-4 w-4" />
                      ) : (
                        <GitLab className="h-4 w-4" />
                      )}
                      <CardTitle className="text-lg">
                        <Link
                          href={`/dashboard/repositories/${extractRepoId(repo.id)}`}
                          className="hover:underline"
                        >
                          {repo.name}
                        </Link>
                      </CardTitle>
                      {repo.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                      {repo.isArchived && (
                        <Badge variant="outline" className="text-xs">
                          <Archive className="mr-1 h-3 w-3" />
                          Archived
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {repo.fullName}
                    </p>
                  </div>
                  <Link
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                {repo.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {repo.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {repo.language && (
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded-full bg-primary" />
                      {repo.language}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {repo.stars}
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    {repo.forks}
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {repo.openIssues}
                  </div>
                  <div className="flex items-center gap-1">
                    <GitCommit className="h-4 w-4" />
                    {repo._count.commits}
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-4 w-4" />
                    {repo._count.branches}
                  </div>
                </div>
                {repo.topics &&
                  Array.isArray(repo.topics) &&
                  repo.topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {repo.topics.slice(0, 5).map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="text-xs"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              No repositories found
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect your GitHub or GitLab account and sync your repositories
            </p>
            <Button onClick={() => syncAllMutation.mutate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Repositories
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
