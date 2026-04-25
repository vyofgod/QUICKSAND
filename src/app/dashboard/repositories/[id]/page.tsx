"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch,
  GitCommit,
  Star,
  GitFork,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,
  FileCode,
  Github,
  GitlabIcon as GitLab,
  Archive,
  Code,
  Activity,
  Folder,
  File,
  ChevronRight,
  Home,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

// ─── File Browser ────────────────────────────────────────────────────────────

function FileBrowser({ repositoryId }: { repositoryId: string }) {
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentRef, setCurrentRef] = useState<string | undefined>(undefined);

  const { data: files, isLoading: filesLoading, error: filesError } =
    trpc.repository.getFiles.useQuery(
      { repositoryId, path: currentPath, ref: currentRef },
      { enabled: selectedFile === null }
    );

  const { data: fileContent, isLoading: contentLoading, error: contentError } =
    trpc.repository.getFileContent.useQuery(
      { repositoryId, path: selectedFile ?? "", ref: currentRef },
      { enabled: selectedFile !== null }
    );

  const pathParts = currentPath ? currentPath.split("/") : [];

  function navigateTo(path: string) {
    setCurrentPath(path);
    setSelectedFile(null);
  }

  function openFile(path: string) {
    setSelectedFile(path);
  }

  function goBack() {
    if (selectedFile !== null) {
      setSelectedFile(null);
      return;
    }
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
  }

  // ── Breadcrumb ──────────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-1 overflow-x-auto text-sm text-muted-foreground pb-1">
      <button
        onClick={() => navigateTo("")}
        className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0"
      >
        <Home className="h-3.5 w-3.5" />
        <span>root</span>
      </button>
      {pathParts.map((part, i) => {
        const path = pathParts.slice(0, i + 1).join("/");
        const isLast = i === pathParts.length - 1 && selectedFile === null;
        return (
          <span key={path} className="flex items-center gap-1 shrink-0">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium">{part}</span>
            ) : (
              <button
                onClick={() => navigateTo(path)}
                className="hover:text-foreground transition-colors"
              >
                {part}
              </button>
            )}
          </span>
        );
      })}
      {selectedFile && (
        <span className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">
            {selectedFile.split("/").pop()}
          </span>
        </span>
      )}
    </div>
  );

  // ── File content view ───────────────────────────────────────────────────────
  if (selectedFile !== null) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goBack} className="h-8 px-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Breadcrumb />
          </div>
          {fileContent && (
            <div className="text-xs text-muted-foreground mt-1">
              {fileContent.size.toLocaleString()} bytes
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {contentLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {contentError && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {contentError.message.includes("too large") || contentError.message.includes("size")
                  ? "File is too large to display."
                  : "Could not load file content."}
              </p>
            </div>
          )}
          {fileContent && !contentLoading && (
            <div className="overflow-x-auto rounded-b-lg">
              <table className="w-full text-xs font-mono">
                <tbody>
                  {fileContent.content.split("\n").map((line, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="select-none text-right text-muted-foreground/60 pr-4 pl-4 py-px w-12 border-r border-border">
                        {i + 1}
                      </td>
                      <td className="pl-4 pr-4 py-px whitespace-pre">
                        {line || " "}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Directory listing ───────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {currentPath && (
            <Button variant="ghost" size="sm" onClick={goBack} className="h-8 px-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Breadcrumb />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filesLoading && (
          <div className="space-y-0 divide-y">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        )}
        {filesError && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{filesError.message}</p>
          </div>
        )}
        {files && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Folder className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Empty directory</p>
          </div>
        )}
        {files && files.length > 0 && (
          <div className="divide-y">
            {/* Directories first, then files */}
            {[...files]
              .sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === "dir" ? -1 : 1;
              })
              .map((item) => (
                <button
                  key={item.path}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  onClick={() =>
                    item.type === "dir" ? navigateTo(item.path) : openFile(item.path)
                  }
                >
                  {item.type === "dir" ? (
                    <Folder className="h-4 w-4 text-blue-400 shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm ${item.type === "dir" ? "font-medium" : ""}`}>
                    {item.name}
                  </span>
                  {item.type === "file" && item.size != null && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.size < 1024
                        ? `${item.size} B`
                        : item.size < 1024 * 1024
                        ? `${(item.size / 1024).toFixed(1)} KB`
                        : `${(item.size / 1024 / 1024).toFixed(1)} MB`}
                    </span>
                  )}
                  {item.type === "dir" && (
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  )}
                </button>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RepositoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const repositoryId = params.id as string;

  const [commitPage, setCommitPage] = useState(0);
  const commitsPerPage = 20;

  const {
    data: repository,
    isLoading,
    error,
  } = trpc.repository.getById.useQuery({
    id: repositoryId,
  });

  const { data: commitsData, isLoading: commitsLoading } =
    trpc.repository.getCommits.useQuery(
      {
        repositoryId,
        limit: commitsPerPage,
        offset: commitPage * commitsPerPage,
      },
      {
        enabled: !!repository,
      }
    );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!repository || error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="text-2xl font-semibold">Repository not found</h3>
          <p className="max-w-md text-muted-foreground">
            The repository you&apos;re looking for doesn&apos;t exist or you don&apos;t have
            access to it. Make sure you&apos;ve synced your repositories first.
          </p>
          <Button onClick={() => router.push("/dashboard/repositories")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Repositories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/repositories")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {repository.provider === "GITHUB" ? (
              <Github className="h-6 w-6 text-muted-foreground" />
            ) : (
              <GitLab className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{repository.name}</h1>
                {repository.isPrivate ? (
                  <Badge variant="outline">Private</Badge>
                ) : (
                  <Badge variant="secondary">Public</Badge>
                )}
                {repository.isArchived && (
                  <Badge variant="outline" className="text-yellow-600">
                    <Archive className="mr-1 h-3 w-3" />
                    Archived
                  </Badge>
                )}
              </div>
              {repository.description && (
                <p className="mt-1 text-muted-foreground">
                  {repository.description}
                </p>
              )}
            </div>
          </div>

          <Link href={repository.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on {repository.provider === "GITHUB" ? "GitHub" : "GitLab"}
            </Button>
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span className="font-semibold">{repository.stars}</span>
            <span>stars</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            <span className="font-semibold">{repository.forks}</span>
            <span>forks</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold">{repository.openIssues}</span>
            <span>issues</span>
          </div>
          {repository.language && (
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>{repository.language}</span>
            </div>
          )}
        </div>

        {repository.topics &&
          Array.isArray(repository.topics) &&
          repository.topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {repository.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="rounded-full">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="code"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Code className="mr-2 h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger
            value="commits"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <GitCommit className="mr-2 h-4 w-4" />
            Commits
            <Badge variant="secondary" className="ml-2">
              {repository._count.commits}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="branches"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <GitBranch className="mr-2 h-4 w-4" />
            Branches
            <Badge variant="secondary" className="ml-2">
              {repository.branches.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Activity className="mr-2 h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>

        {/* Code Tab — real file browser */}
        <TabsContent value="code" className="mt-6">
          <FileBrowser repositoryId={repositoryId} />
        </TabsContent>

        {/* Commits Tab */}
        <TabsContent value="commits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Commit History</CardTitle>
            </CardHeader>
            <CardContent>
              {commitsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : commitsData && commitsData.commits.length > 0 ? (
                <>
                  <div className="space-y-0 divide-y">
                    {commitsData.commits.map((commit) => (
                      <div
                        key={commit.id}
                        className="-mx-4 flex items-start gap-4 rounded-lg px-4 py-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-sm font-medium">
                            {commit.message.split("\n")[0]}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {commit.author}
                            </span>
                            <span>
                              {formatDistanceToNow(
                                new Date(commit.committedAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-mono text-green-600">
                            +{commit.additions}
                          </span>
                          <span className="font-mono text-red-600">
                            -{commit.deletions}
                          </span>
                          <Link
                            href={commit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" className="h-8">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {commitsData.total > commitsPerPage && (
                    <div className="mt-6 flex items-center justify-between border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommitPage((p) => Math.max(0, p - 1))}
                        disabled={commitPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {commitPage + 1} of{" "}
                        {Math.ceil(commitsData.total / commitsPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommitPage((p) => p + 1)}
                        disabled={!commitsData.hasMore}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <GitCommit className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No commits found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
            </CardHeader>
            <CardContent>
              {repository.branches.length > 0 ? (
                <div className="space-y-0 divide-y">
                  {repository.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="-mx-4 flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{branch.name}</span>
                        {branch.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        {branch.isProtected && (
                          <Badge variant="outline">Protected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <GitBranch className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No branches found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {repository.language && (
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Primary Language:</strong> {repository.language}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Owner:</strong> {repository.ownerName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Created:</strong>{" "}
                    {formatDistanceToNow(new Date(repository.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Last Updated:</strong>{" "}
                    {formatDistanceToNow(new Date(repository.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {repository.pushedAt && (
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Last Push:</strong>{" "}
                      {formatDistanceToNow(new Date(repository.pushedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
                {repository.homepage && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <Link
                      href={repository.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {repository.homepage}
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
