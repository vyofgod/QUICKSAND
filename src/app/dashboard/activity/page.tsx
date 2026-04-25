import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitCommit,
  GitPullRequest,
  GitMerge,
  MessageSquare,
  CheckCircle2,
  Timer,
  Github,
  GitlabIcon as Gitlab,
  Calendar,
  TrendingUp,
  Activity as ActivityIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ActivitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

async function ActivityStats() {
  // TODO: Fetch real data from tRPC
  const stats = {
    todayActivities: 12,
    weekCommits: 24,
    weekPRs: 5,
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayActivities}</div>
          <p className="text-xs text-muted-foreground">activities logged</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <GitCommit className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.weekCommits}</div>
          <p className="text-xs text-muted-foreground">commits pushed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
          <GitPullRequest className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.weekPRs}</div>
          <p className="text-xs text-muted-foreground">opened this week</p>
        </CardContent>
      </Card>
    </div>
  );
}

const activityIcons = {
  COMMIT: GitCommit,
  PULL_REQUEST: GitPullRequest,
  MERGE_REQUEST: GitPullRequest,
  ISSUE: MessageSquare,
  REVIEW: MessageSquare,
  COMMENT: MessageSquare,
  TASK_COMPLETED: CheckCircle2,
  FOCUS_SESSION: Timer,
};

const sourceIcons = {
  GITHUB: Github,
  GITLAB: Gitlab,
  LOCAL: ActivityIcon,
};

async function ActivityFeedContent() {
  // TODO: Fetch real data from tRPC
  const activities = [
    {
      id: "1",
      type: "COMMIT",
      source: "GITHUB",
      title: "feat: Add user authentication",
      description: "Implemented JWT-based authentication with refresh tokens",
      url: "https://github.com/user/repo/commit/abc123",
      occurredAt: new Date(Date.now() - 1800000),
    },
    {
      id: "2",
      type: "PULL_REQUEST",
      source: "GITHUB",
      title: "PR #123: Refactor database queries",
      description: "Optimized database queries for better performance",
      url: "https://github.com/user/repo/pull/123",
      occurredAt: new Date(Date.now() - 3600000),
    },
    {
      id: "3",
      type: "TASK_COMPLETED",
      source: "LOCAL",
      title: "Completed: Design system documentation",
      description: "Finished documenting all UI components",
      occurredAt: new Date(Date.now() - 7200000),
    },
    {
      id: "4",
      type: "FOCUS_SESSION",
      source: "LOCAL",
      title: "Focus session completed",
      description: "25 minutes of focused work on API development",
      occurredAt: new Date(Date.now() - 10800000),
    },
    {
      id: "5",
      type: "REVIEW",
      source: "GITHUB",
      title: "Reviewed PR #120",
      description: "Code review for authentication improvements",
      url: "https://github.com/user/repo/pull/120",
      occurredAt: new Date(Date.now() - 14400000),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Feed</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type as keyof typeof activityIcons];
            const SourceIcon = sourceIcons[activity.source as keyof typeof sourceIcons];

            return (
              <div
                key={activity.id}
                className="flex gap-4 border-b pb-6 last:border-0 last:pb-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      <SourceIcon className="mr-1 h-3 w-3" />
                      {activity.source}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(activity.occurredAt).toLocaleString()}
                    </span>
                    {activity.url && (
                      <>
                        <span>•</span>
                        <a
                          href={activity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          View on {activity.source}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">
          Track your development activity and progress
        </p>
      </div>

      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityStats />

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="gitlab">GitLab</TabsTrigger>
            <TabsTrigger value="local">Local</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <ActivityFeedContent />
          </TabsContent>
          <TabsContent value="github" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Github className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    Connect GitHub
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Connect your GitHub account to see your commits, PRs, and more
                  </p>
                  <Button>Connect GitHub</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="gitlab" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gitlab className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    Connect GitLab
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Connect your GitLab account to see your merge requests and activity
                  </p>
                  <Button>Connect GitLab</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="local" className="space-y-4">
            <ActivityFeedContent />
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  );
}
