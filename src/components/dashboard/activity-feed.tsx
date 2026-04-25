"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  GitCommit,
  GitPullRequest,
  MessageSquare,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { ActivityType } from "@/lib/db-schema";

const activityIcons = {
  [ActivityType.COMMIT]: GitCommit,
  [ActivityType.PULL_REQUEST]: GitPullRequest,
  [ActivityType.MERGE_REQUEST]: GitPullRequest,
  [ActivityType.ISSUE]: MessageSquare,
  [ActivityType.REVIEW]: MessageSquare,
  [ActivityType.COMMENT]: MessageSquare,
  [ActivityType.TASK_COMPLETED]: Activity,
  [ActivityType.FOCUS_SESSION]: Activity,
};

const activityColors = {
  [ActivityType.COMMIT]: "text-blue-600",
  [ActivityType.PULL_REQUEST]: "text-green-600",
  [ActivityType.MERGE_REQUEST]: "text-green-600",
  [ActivityType.ISSUE]: "text-orange-600",
  [ActivityType.REVIEW]: "text-purple-600",
  [ActivityType.COMMENT]: "text-gray-600",
  [ActivityType.TASK_COMPLETED]: "text-emerald-600",
  [ActivityType.FOCUS_SESSION]: "text-indigo-600",
};

export function ActivityFeed() {
  const { data: activities, isLoading } = trpc.activity.getAll.useQuery({
    limit: 10,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const colorClass = activityColors[activity.type];

              return (
                <div key={activity.id} className="flex gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ${colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {activity.title}
                      </p>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {activity.source}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(activity.occurredAt))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No recent activity. Start working on tasks to see your activity
              here!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
