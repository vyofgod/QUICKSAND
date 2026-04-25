import { Suspense } from "react";
import { AIInsightsPanel } from "@/components/dashboard/ai-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  Target,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function InsightsSkeleton() {
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
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

async function InsightsOverview() {
  // TODO: Fetch real data from tRPC
  const insights = {
    productivity: {
      trend: "up",
      message: "Your productivity is 23% higher than last week",
    },
    focus: {
      trend: "up",
      message: "Average focus session duration increased to 28 minutes",
    },
    tasks: {
      trend: "neutral",
      message: "You completed 12 tasks this week, same as last week",
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Productivity</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {insights.productivity.message}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Focus Quality</CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {insights.focus.message}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
          <Lightbulb className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {insights.tasks.message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function AIRecommendations() {
  // TODO: Fetch real data from tRPC
  const recommendations = [
    {
      id: "1",
      type: "PRODUCTIVITY",
      title: "Optimize your morning routine",
      description:
        "Based on your activity patterns, you're most productive between 9-11 AM. Consider scheduling complex tasks during this time.",
      priority: "HIGH",
    },
    {
      id: "2",
      type: "FOCUS",
      title: "Take more breaks",
      description:
        "Your focus sessions are getting longer, but taking regular breaks can improve overall productivity. Try the 52-17 method.",
      priority: "MEDIUM",
    },
    {
      id: "3",
      type: "TASKS",
      title: "Review pending tasks",
      description:
        "You have 3 tasks in 'In Review' status for more than 2 days. Consider following up or moving them forward.",
      priority: "MEDIUM",
    },
    {
      id: "4",
      type: "HABITS",
      title: "Maintain your streak",
      description:
        "You're on a 5-day focus streak! Keep it up by completing at least one focus session today.",
      priority: "LOW",
    },
  ];

  const priorityColors = {
    HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Recommendations</CardTitle>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{rec.title}</h3>
                    <Badge
                      variant="outline"
                      className={
                        priorityColors[rec.priority as keyof typeof priorityColors]
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rec.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function AIChat() {
  // TODO: Fetch real chat history from tRPC
  const chatHistory = [
    {
      id: "1",
      role: "user",
      content: "What should I focus on today?",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      role: "assistant",
      content:
        "Based on your task priorities and deadlines, I recommend focusing on the authentication implementation task first. It's marked as high priority and due tomorrow. You have a 2-hour focus session scheduled this morning, which would be perfect for this task.",
      timestamp: new Date(Date.now() - 3500000),
    },
  ];

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {/* Chat Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 border-t pt-4">
          <Textarea
            placeholder="Ask AI for insights, recommendations, or help..."
            className="min-h-[60px] resize-none"
          />
          <Button size="icon" className="h-[60px] w-[60px] shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Get personalized recommendations and insights powered by AI
        </p>
      </div>

      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsOverview />

        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AIRecommendations />
              </div>
              <div>
                <AIInsightsPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <AIChat />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Insight History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          Weekly productivity summary generated
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            Date.now() - i * 86400000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  );
}
