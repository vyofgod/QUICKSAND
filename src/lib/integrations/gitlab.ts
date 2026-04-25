/**
 * GitLab API Integration
 * Handles fetching projects, commits, and other GitLab data
 */

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  homepage?: string | null;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics: string[];
  visibility: "private" | "internal" | "public";
  archived: boolean;
  namespace: {
    name: string;
    path: string;
    avatar_url: string | null;
  };
  created_at: string;
  last_activity_at: string;
  forked_from_project?: {
    id: number;
    name: string;
  };
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  web_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    created_at: string;
  };
  protected: boolean;
  default: boolean;
}

export interface GitLabTreeItem {
  id: string;
  name: string;
  type: "blob" | "tree";
  path: string;
  mode: string;
}

export interface GitLabFileContent {
  file_name: string;
  file_path: string;
  size: number;
  encoding: "base64";
  content: string;
  ref: string;
}

export class GitLabClient {
  private accessToken: string;
  private baseUrl: string;

  constructor(accessToken: string, baseUrl = "https://gitlab.com/api/v4") {
    this.accessToken = accessToken;
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Fetch all projects for the authenticated user
   */
  async getProjects(): Promise<GitLabProject[]> {
    const projects: GitLabProject[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const batch = await this.fetch<GitLabProject[]>(
        `/projects?membership=true&per_page=${perPage}&page=${page}&order_by=last_activity_at&sort=desc`
      );

      if (batch.length === 0) break;
      projects.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    return projects;
  }

  /**
   * Fetch commits for a specific project
   */
  async getCommits(
    projectId: number,
    options?: {
      since?: string;
      until?: string;
      per_page?: number;
      ref_name?: string;
    }
  ): Promise<GitLabCommit[]> {
    const params = new URLSearchParams();
    if (options?.since) params.append("since", options.since);
    if (options?.until) params.append("until", options.until);
    if (options?.ref_name) params.append("ref_name", options.ref_name);
    params.append("per_page", String(options?.per_page || 100));
    params.append("with_stats", "true");

    return this.fetch<GitLabCommit[]>(
      `/projects/${projectId}/repository/commits?${params.toString()}`
    );
  }

  /**
   * Fetch branches for a specific project
   */
  async getBranches(projectId: number): Promise<GitLabBranch[]> {
    return this.fetch<GitLabBranch[]>(
      `/projects/${projectId}/repository/branches`
    );
  }

  /**
   * Fetch project details
   */
  async getProject(projectId: number): Promise<GitLabProject> {
    return this.fetch<GitLabProject>(`/projects/${projectId}`);
  }

  /**
   * Fetch directory tree for a project
   */
  async getTree(
    projectId: number | string,
    path = "",
    ref?: string
  ): Promise<GitLabTreeItem[]> {
    const params = new URLSearchParams({ per_page: "100" });
    if (path) params.set("path", path);
    if (ref) params.set("ref", ref);
    return this.fetch<GitLabTreeItem[]>(
      `/projects/${projectId}/repository/tree?${params.toString()}`
    );
  }

  /**
   * Fetch content of a single file
   */
  async getFileContent(
    projectId: number | string,
    filePath: string,
    ref?: string
  ): Promise<GitLabFileContent> {
    const encodedPath = encodeURIComponent(filePath);
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return this.fetch<GitLabFileContent>(
      `/projects/${projectId}/repository/files/${encodedPath}${query}`
    );
  }

  /**
   * Fetch user's profile information
   */
  async getUser(): Promise<{
    id: number;
    username: string;
    name: string;
    email: string;
    avatar_url: string;
  }> {
    return this.fetch("/user");
  }
}
