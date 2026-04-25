import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

async function AnalyticsOverview() {
  // TODO: Fetch real data from tRPC
  const stats = {
    productivity: { value: 87, change: 12, trend: "up" },
    tasksCompleted: { value: 156, change: 23, trend: "up" },
    focusTime: { value: "42h", change: -5, trend: "down" },
    efficiency: { value: 92, change: 8, trend: "up" },
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.productivity.value}%</div>
          <div className="flex items-center gap-1 text-xs">
            {stats.productivity.trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={
                stats.productivity.trend === "up"
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              {stats.productivity.change}%
            </span>
            <span className="text-muted-foreground">from last week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tasksCompleted.value}</div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500">+{stats.tasksCompleted.change}</span>
            <span className="text-muted-foreground">from last week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.focusTime.value}</div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className="text-red-500">{stats.focusTime.change}%</span>
            <span className="text-muted-foreground">from last week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.efficiency.value}%</div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500">+{stats.efficiency.change}%</span>
            <span className="text-muted-foreground">from last week</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ProductivityChart() {
  const weekData = [
    { day: "Mon", tasks: 12, focus: 180 },
    { day: "Tue", tasks: 15, focus: 210 },
    { day: "Wed", tasks: 10, focus: 150 },
    { day: "Thu", tasks: 18, focus: 240 },
    { day: "Fri", tasks: 14, focus: 200 },
    { day: "Sat", tasks: 8, focus: 120 },
    { day: "Sun", tasks: 5, focus: 90 },
  ];

  const maxTasks = Math.max(...weekData.map((d) => d.tasks));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Weekly Productivity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weekData.map((day) => (
            <div key={day.day} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{day.day}</span>
                <div className="flex gap-4 text-muted-foreground">
                  <span>{day.tasks} tasks</span>
                  <span>{day.focus} min</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Progress value={(day.tasks / maxTasks) * 100} className="h-2" />
                <Progress
                  value={(day.focus / 240) * 100}
                  className="h-2 bg-primary/20"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function TaskDistribution() {
  const distribution = [
    { status: "Completed", count: 124, percentage: 62, color: "bg-green-500" },
    { status: "In Progress", count: 45, percentage: 23, color: "bg-blue-500" },
    { status: "To Do", count: 20, percentage: 10, color: "bg-yellow-500" },
    { status: "Blocked", count: 11, percentage: 5, color: "bg-red-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Task Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.status} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="font-medium">{item.status}</span>
                </div>
                <div className="flex gap-2 text-muted-foreground">
                  <span>{item.count}</span>
                  <span>({item.percentage}%)</span>
                </div>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function TimeAnalysis() {
  const timeData = [
    { category: "Development", hours: 28, percentage: 70 },
    { category: "Meetings", hours: 6, percentage: 15 },
    { category: "Code Review", hours: 4, percentage: 10 },
    { category: "Planning", hours: 2, percentage: 5 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeData.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.category}</span>
                <div className="flex gap-2 text-muted-foreground">
                  <span>{item.hours}h</span>
                  <span>({item.percentage}%)</span>
                </div>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Deep insights into your productivity and performance
        </p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsOverview />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <ProductivityChart />
              <TaskDistribution />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <TaskDistribution />
              <Card>
                <CardHeader>
                  <CardTitle>Task Velocity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Average completion time
                      </span>
                      <span className="font-semibold">2.3 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Tasks per week
                      </span>
                      <span className="font-semibold">22</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Success rate
                      </span>
                      <span className="font-semibold">94%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <TimeAnalysis />
              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>Most productive</span>
                        <Badge>9:00 - 11:00 AM</Badge>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>Moderate</span>
                        <Badge variant="secondary">2:00 - 4:00 PM</Badge>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>Low energy</span>
                        <Badge variant="outline">12:00 - 1:00 PM</Badge>
                      </div>
                      <Progress value={40} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  30-Day Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 font-semibold">Key Insights</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <TrendingUp className="h-5 w-5 shrink-0 text-green-500" />
                        <div>
                          <p className="font-medium">Productivity increasing</p>
                          <p className="text-sm text-muted-foreground">
                            Your productivity has increased by 23% over the last month
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <TrendingUp className="h-5 w-5 shrink-0 text-green-500" />
                        <div>
                          <p className="font-medium">Consistent focus time</p>
                          <p className="text-sm text-muted-foreground">
                            You've maintained an average of 4+ hours daily focus
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Activity className="h-5 w-5 shrink-0 text-blue-500" />
                        <div>
                          <p className="font-medium">Peak performance days</p>
                          <p className="text-sm text-muted-foreground">
                            Tuesday and Thursday are your most productive days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  );
}
