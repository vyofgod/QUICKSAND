import { Suspense } from "react";
import { DashboardStats } from "@/components/dashboard/stats";
import { TaskBoard } from "@/components/dashboard/task-board";
import { AIInsightsPanel } from "@/components/dashboard/ai-insights";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PendingReviewsWidget } from "@/components/dashboard/pending-reviews-widget";
import { StreakWidget } from "@/components/dashboard/streak-widget";
import { RecentDeploymentsWidget } from "@/components/dashboard/recent-deployments-widget";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[600px] w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your productivity overview.
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TaskBoard />
            <ActivityFeed />
          </div>

          <div className="space-y-6">
            <PendingReviewsWidget />
            <StreakWidget />
            <RecentDeploymentsWidget />
            <AIInsightsPanel />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
