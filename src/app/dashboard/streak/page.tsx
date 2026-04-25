"use client";

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
  Flame,
  Trophy,
  GitCommit,
  GitPullRequest,
  Star,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AchievementType } from "@/lib/db-schema";

const achievementMeta: Record<AchievementType, { label: string; description: string; icon: React.ReactNode }> = {
  [AchievementType.COMMITS_10]: { label: "First Steps", description: "Made 10 commits", icon: <GitCommit className="h-5 w-5" /> },
  [AchievementType.COMMITS_100]: { label: "Century", description: "Made 100 commits", icon: <GitCommit className="h-5 w-5 text-blue-500" /> },
  [AchievementType.COMMITS_1000]: { label: "Thousand Strong", description: "Made 1000 commits", icon: <GitCommit className="h-5 w-5 text-purple-500" /> },
  [AchievementType.PRS_10]: { label: "PR Pioneer", description: "Opened 10 pull requests", icon: <GitPullRequest className="h-5 w-5" /> },
  [AchievementType.PRS_50]: { label: "PR Master", description: "Opened 50 pull requests", icon: <GitPullRequest className="h-5 w-5 text-green-500" /> },
  [AchievementType.REVIEWS_10]: { label: "Code Reviewer", description: "Reviewed 10 pull requests", icon: <Star className="h-5 w-5" /> },
  [AchievementType.REVIEWS_50]: { label: "Review Expert", description: "Reviewed 50 pull requests", icon: <Star className="h-5 w-5 text-yellow-500" /> },
  [AchievementType.STREAK_7]: { label: "Week Warrior", description: "7-day commit streak", icon: <Flame className="h-5 w-5 text-orange-400" /> },
  [AchievementType.STREAK_30]: { label: "Month Master", description: "30-day commit streak", icon: <Flame className="h-5 w-5 text-orange-500" /> },
  [AchievementType.STREAK_100]: { label: "Century Streak", description: "100-day commit streak", icon: <Flame className="h-5 w-5 text-red-500" /> },
  [AchievementType.DEPLOYMENTS_10]: { label: "Deploy Master", description: "10 successful deployments", icon: <Zap className="h-5 w-5 text-yellow-500" /> },
};

export default function StreakPage() {
  const { data: streak, isLoading } = api.streak.get.useQuery();
  const { data: achievements } = api.streak.achievements.useQuery();
  const { data: contributions } = api.streak.contributions.useQuery({ period: "year" });
  const { data: monthContribs } = api.streak.contributions.useQuery({ period: "month" });
  const utils = api.useUtils();
  const recalcMutation = api.streak.recalculate.useMutation({
    onSuccess: () => {
      utils.streak.get.invalidate();
      utils.streak.achievements.invalidate();
    },
  });

  const unlockedTypes = new Set(achievements?.map((a) => a.type) ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commit Streak</h1>
          <p className="text-muted-foreground">
            Track your coding consistency and achievements
          </p>
        </div>
        <Button
          onClick={() => recalcMutation.mutate()}
          disabled={recalcMutation.isPending}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${recalcMutation.isPending ? "animate-spin" : ""}`}
          />
          Recalculate
        </Button>
      </div>

      {/* Streak Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <div className="text-4xl font-bold">{streak?.currentStreak ?? 0}</div>
              <p className="text-muted-foreground">Day streak</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Best Streak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak?.longestStreak ?? 0} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <GitCommit className="h-3 w-3" /> Total Commits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak?.totalCommits ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <GitPullRequest className="h-3 w-3" /> Total PRs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak?.totalPRs ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contributions">
        <TabsList>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="achievements">
            Achievements
            {achievements && achievements.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {achievements.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Contributions</CardTitle>
              <CardDescription>Commits per day this month</CardDescription>
            </CardHeader>
            <CardContent>
              {!monthContribs || monthContribs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No contributions yet. Sync your repositories first.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthContribs}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yearly Contributions</CardTitle>
              <CardDescription>Commits per day this year</CardDescription>
            </CardHeader>
            <CardContent>
              {!contributions || contributions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No contributions yet. Sync your repositories first.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={contributions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(achievementMeta) as AchievementType[]).map((type) => {
              const meta = achievementMeta[type];
              const unlocked = unlockedTypes.has(type);
              return (
                <Card
                  key={type}
                  className={unlocked ? "border-primary/50" : "opacity-50"}
                >
                  <CardContent className="flex items-center gap-3 py-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        unlocked ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                    {unlocked && (
                      <Badge variant="secondary" className="ml-auto">
                        Unlocked
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
