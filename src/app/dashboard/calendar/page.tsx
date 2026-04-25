import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
} from "lucide-react";

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

async function CalendarView() {
  // TODO: Fetch real data from tRPC
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();

  const events = [
    {
      id: "1",
      title: "Team Standup",
      date: new Date(),
      time: "09:00",
      duration: "30 min",
      type: "meeting",
      location: "Zoom",
    },
    {
      id: "2",
      title: "Code Review Session",
      date: new Date(),
      time: "14:00",
      duration: "1 hour",
      type: "work",
    },
    {
      id: "3",
      title: "Sprint Planning",
      date: new Date(Date.now() + 86400000),
      time: "10:00",
      duration: "2 hours",
      type: "meeting",
    },
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentYear, currentDate.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {currentMonth} {currentYear}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                Today
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            {days.map((day) => {
              const isToday = day === currentDate.getDate();
              const hasEvents = events.some(
                (e) => new Date(e.date).getDate() === day
              );

              return (
                <button
                  key={day}
                  className={`relative min-h-[80px] rounded-lg border p-2 text-left transition-colors hover:bg-accent ${
                    isToday ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-primary" : ""
                    }`}
                  >
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="mt-1 space-y-1">
                      {events
                        .filter((e) => new Date(e.date).getDate() === day)
                        .slice(0, 2)
                        .map((event) => (
                          <div
                            key={event.id}
                            className="truncate rounded bg-primary/10 px-1 py-0.5 text-xs text-primary"
                          >
                            {event.time} {event.title}
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge
                      variant={
                        event.type === "meeting" ? "default" : "secondary"
                      }
                    >
                      {event.type}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3" />
                      {event.date.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {event.time} ({event.duration})
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Events this week
                </span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Meetings today
                </span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Focus time
                </span>
                <span className="font-semibold">4h 30m</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your schedule and upcoming events
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarView />
      </Suspense>
    </div>
  );
}
