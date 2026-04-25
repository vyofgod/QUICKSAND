"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, GitPullRequest, Activity, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const { data: stats, isLoading } = trpc.user.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Tasks Completed Today",
      value: stats.completedToday,
      description: `${stats.totalTasks} total tasks`,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Open Pull Requests",
      value: stats.openPRs,
      description: "Across all repositories",
      icon: GitPullRequest,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Activities Today",
      value: stats.activitiesToday,
      description: "Commits, PRs, and more",
      icon: Activity,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Productivity Score",
      value: Math.min(
        100,
        Math.round(stats.completedToday * 20 + stats.activitiesToday * 5)
      ),
      description: "Based on today's activity",
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={cn("h-4 w-4", stat.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
