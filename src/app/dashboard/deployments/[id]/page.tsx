"use client";

import { use } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { DeploymentStatus } from "@/lib/db-schema";

const statusConfig: Record<
  DeploymentStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  [DeploymentStatus.SUCCESS]: {
    label: "Success",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    className: "text-green-600 bg-green-500/10",
  },
  [DeploymentStatus.FAILED]: {
    label: "Failed",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    className: "text-red-600 bg-red-500/10",
  },
  [DeploymentStatus.BUILDING]: {
    label: "Building",
    icon: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
    className: "text-blue-600 bg-blue-500/10",
  },
  [DeploymentStatus.PENDING]: {
    label: "Pending",
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
    className: "text-yellow-600 bg-yellow-500/10",
  },
  [DeploymentStatus.CANCELLED]: {
    label: "Cancelled",
    icon: <XCircle className="h-5 w-5 text-gray-400" />,
    className: "text-gray-500 bg-gray-500/10",
  },
};

export default function DeploymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: deployment, isLoading } = api.deployment.get.useQuery({ id });
  const utils = api.useUtils();

  const rollbackMutation = api.deployment.rollback.useMutation({
    onSuccess: () => {
      utils.deployment.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Deployment not found.</p>
        <Link href="/dashboard/deployments">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Deployments
          </Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[deployment.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/deployments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Deployment: {deployment.branch}
            </h1>
            <p className="text-muted-foreground capitalize">
              {deployment.environment} · {deployment.triggeredBy}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deployment.url && (
            <a href={deployment.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Live
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              rollbackMutation.mutate({ deploymentId: String(deployment.id) })
            }
            disabled={rollbackMutation.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Rollback
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          {config.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{config.label}</span>
              <Badge variant="outline" className="capitalize">
                {deployment.environment}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Started: {new Date(deployment.createdAt).toLocaleString()}
              {deployment.finishedAt &&
                ` · Finished: ${new Date(deployment.finishedAt).toLocaleString()}`}
              {deployment.buildDuration &&
                ` · Duration: ${deployment.buildDuration}s`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch</span>
              <span className="font-mono">{deployment.branch}</span>
            </div>
            {deployment.commit && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commit</span>
                <span className="font-mono text-xs">{deployment.commit.slice(0, 8)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Triggered by</span>
              <span className="capitalize">{deployment.triggeredBy}</span>
            </div>
            {deployment.url && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL</span>
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate max-w-48"
                >
                  {deployment.url}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Build Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
              {deployment.logs || "No logs available"}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
