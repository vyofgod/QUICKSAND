"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitPullRequest,
  Clock,
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { PRState } from "@/lib/db-schema";

const stateIcon = {
  [PRState.OPEN]: <GitPullRequest className="h-4 w-4 text-green-500" />,
  [PRState.DRAFT]: <GitPullRequest className="h-4 w-4 text-gray-400" />,
  [PRState.MERGED]: <GitMerge className="h-4 w-4 text-purple-500" />,
  [PRState.CLOSED]: <XCircle className="h-4 w-4 text-red-500" />,
};

function PRCard({ pr }: { pr: {
  id: unknown;
  number: number;
  title: string;
  state: PRState;
  author: string;
  authorAvatar?: string;
  sourceBranch: string;
  targetBranch: string;
  requestedReviewers: string[];
  labels: string[];
  hasConflicts: boolean;
  ciStatus?: string;
  additions: number;
  deletions: number;
  url: string;
  createdAt: Date;
}}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {stateIcon[pr.state]}
            <div>
              <CardTitle className="text-base leading-tight">{pr.title}</CardTitle>
              <CardDescription className="mt-1">
                #{pr.number} by {pr.author} &bull; {pr.sourceBranch} → {pr.targetBranch}
              </CardDescription>
            </div>
          </div>
          <a href={pr.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {pr.hasConflicts && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Conflicts
            </Badge>
          )}
          {pr.ciStatus && (
            <Badge
              variant={pr.ciStatus === "success" ? "secondary" : "outline"}
              className="gap-1"
            >
              {pr.ciStatus === "success" ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              CI: {pr.ciStatus}
            </Badge>
          )}
          {pr.labels.slice(0, 3).map((label) => (
            <Badge key={label} variant="outline" className="text-xs">
              {label}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            <span className="text-green-600">+{pr.additions}</span>{" "}
            <span className="text-red-600">-{pr.deletions}</span>
          </span>
        </div>
        {pr.requestedReviewers.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Reviewers: {pr.requestedReviewers.join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReviewsPage() {
  const [syncing, setSyncing] = useState(false);
  const utils = api.useUtils();

  const { data: openPRs, isLoading: loadingOpen } = api.pr.list.useQuery({
    state: "open",
  });
  const { data: pendingReviews, isLoading: loadingPending } =
    api.pr.pendingReviews.useQuery();
  const { data: metrics } = api.pr.metrics.useQuery();
  const syncMutation = api.pr.sync.useMutation({
    onSuccess: () => {
      utils.pr.list.invalidate();
      utils.pr.pendingReviews.invalidate();
      utils.pr.metrics.invalidate();
      setSyncing(false);
    },
    onError: () => setSyncing(false),
  });

  const handleSync = () => {
    setSyncing(true);
    syncMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PR Reviews</h1>
          <p className="text-muted-foreground">
            Pull requests and merge requests from your repositories
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sync PRs
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open PRs</CardTitle>
            <GitPullRequest className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.openCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Merged PRs</CardTitle>
            <GitMerge className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.mergedCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Merge Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avgMergeTimeHours ?? 0}h
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Reviews
            {pendingReviews && pendingReviews.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="open">Open PRs</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {loadingPending ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !pendingReviews || pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending review requests
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((pr) => (
                <PRCard key={String(pr.id)} pr={pr as Parameters<typeof PRCard>[0]["pr"]} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="mt-4">
          {loadingOpen ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !openPRs || openPRs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No open pull requests. Click &quot;Sync PRs&quot; to fetch from GitHub/GitLab.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {openPRs.map((pr) => (
                <PRCard key={String(pr.id)} pr={pr as Parameters<typeof PRCard>[0]["pr"]} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
