"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Tag,
  Milestone,
} from "lucide-react";

export default function IssuesPage() {
  const [stateFilter, setStateFilter] = useState<"open" | "closed" | "all">("open");
  const [labelFilter, setLabelFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const utils = api.useUtils();
  const { data: issues, isLoading } = api.issue.list.useQuery({
    state: stateFilter,
    label: labelFilter || undefined,
  });
  const { data: labels } = api.issue.labels.useQuery();
  const { data: milestones } = api.issue.milestones.useQuery();

  const syncMutation = api.issue.sync.useMutation({
    onSuccess: () => {
      utils.issue.list.invalidate();
      utils.issue.labels.invalidate();
      utils.issue.milestones.invalidate();
      setSyncing(false);
    },
    onError: () => setSyncing(false),
  });

  const filteredIssues = issues?.filter((issue) =>
    search
      ? issue.title.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
          <p className="text-muted-foreground">
            All issues from your connected repositories
          </p>
        </div>
        <Button
          onClick={() => { setSyncing(true); syncMutation.mutate(); }}
          disabled={syncing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sync Issues
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-xl font-bold">
                {issues?.filter((i) => i.state === "open").length ?? 0}
              </div>
              <p className="text-sm text-muted-foreground">Open Issues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Tag className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-xl font-bold">{labels?.length ?? 0}</div>
              <p className="text-sm text-muted-foreground">Unique Labels</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Milestone className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-xl font-bold">{milestones?.length ?? 0}</div>
              <p className="text-sm text-muted-foreground">Milestones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={stateFilter}
          onValueChange={(v) => setStateFilter(v as "open" | "closed" | "all")}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={labelFilter || "all"}
          onValueChange={(v) => setLabelFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Labels</SelectItem>
            {labels?.map((l) => (
              <SelectItem key={l.label} value={l.label}>
                {l.label} ({l.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading issues...</p>
      ) : !filteredIssues || filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>No issues found. Click &quot;Sync Issues&quot; to fetch from GitHub/GitLab.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map((issue) => (
            <Card key={String(issue.id)}>
              <CardContent className="flex items-start gap-3 py-3">
                <AlertCircle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    issue.state === "open" ? "text-green-500" : "text-gray-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{issue.title}</p>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    #{issue.number} by {issue.author}
                    {issue.milestone && ` · ${issue.milestone}`}
                  </p>
                  {issue.labels.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {issue.labels.map((label) => (
                        <Badge
                          key={label}
                          variant="outline"
                          className="h-4 px-1.5 text-xs"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
