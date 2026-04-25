"use client";

import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DeploymentStatus } from "@/lib/db-schema";

const statusColors: Record<DeploymentStatus, string> = {
  [DeploymentStatus.SUCCESS]: "bg-green-500/10 text-green-600",
  [DeploymentStatus.FAILED]: "bg-red-500/10 text-red-600",
  [DeploymentStatus.BUILDING]: "bg-blue-500/10 text-blue-600",
  [DeploymentStatus.PENDING]: "bg-yellow-500/10 text-yellow-600",
  [DeploymentStatus.CANCELLED]: "bg-gray-500/10 text-gray-600",
};

export function RecentDeploymentsWidget() {
  const { data: deployments, isLoading } = api.deployment.recent.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Rocket className="h-4 w-4" />
          Recent Deployments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!deployments || deployments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deployments yet</p>
        ) : (
          <div className="space-y-2">
            {deployments.map((dep) => (
              <div
                key={String(dep.id)}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{dep.branch}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {dep.environment}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[dep.status]}`}
                >
                  {dep.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link href="/dashboard/deployments" className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full">
            View All Deployments
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
