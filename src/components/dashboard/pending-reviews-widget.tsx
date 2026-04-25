"use client";

import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitPullRequest, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PendingReviewsWidget() {
  const { data: prs, isLoading } = api.pr.pendingReviews.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <GitPullRequest className="h-4 w-4" />
          Pending Reviews
        </CardTitle>
        {prs && prs.length > 0 && (
          <Badge variant="secondary">{prs.length}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {!prs || prs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending reviews</p>
        ) : (
          <div className="space-y-2">
            {prs.slice(0, 4).map((pr) => (
              <div
                key={String(pr.id)}
                className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{pr.title}</p>
                  <p className="text-xs text-muted-foreground">
                    #{pr.number} by {pr.author}
                  </p>
                </div>
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
            ))}
            {prs.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{prs.length - 4} more
              </p>
            )}
          </div>
        )}
        <Link href="/dashboard/reviews" className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full">
            View All Reviews
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
