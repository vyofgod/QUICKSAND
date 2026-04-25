"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AIInsightsPanel() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: history, isLoading } = trpc.ai.getHistory.useQuery({
    limit: 1,
  });
  const generateSummary = trpc.ai.generateDailySummary.useMutation();
  const utils = trpc.useUtils();

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      await generateSummary.mutateAsync();
      toast.success("Daily summary generated!");
      utils.ai.getHistory.invalidate();
    } catch (error) {
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const latestInsight = history?.[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Insights
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateSummary}
          disabled={isGenerating}
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")}
          />
          Generate
        </Button>
      </CardHeader>
      <CardContent>
        {latestInsight ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {latestInsight.response}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{latestInsight.type}</span>
              <span>
                {new Date(latestInsight.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No insights yet. Generate your first daily summary!
            </p>
            <Button
              size="sm"
              className="mt-4"
              onClick={handleGenerateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Summary"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
