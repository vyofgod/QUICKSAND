"use client";

import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, GitCommit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StreakWidget() {
  const { data: streak, isLoading } = api.streak.get.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Flame className="h-4 w-4 text-orange-500" />
          Commit Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted p-2">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xl font-bold">
                {streak?.currentStreak ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Current</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <div className="flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xl font-bold">
                {streak?.longestStreak ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Best</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <div className="flex items-center justify-center gap-1">
              <GitCommit className="h-4 w-4 text-blue-500" />
              <span className="text-xl font-bold">
                {streak?.totalCommits ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <Link href="/dashboard/streak" className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
