/**
 * GitHub API Integration
 * Handles fetching repositories, commits, and other GitHub data
 */

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  private: boolean;
  fork: boolean;
  archived: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir" | "symlink" | "submodule";
  download_url: string | null;
  html_url: string;
}

export interface GitHubFileContent extends GitHubContent {
  content: string;
  encoding: "base64";
}

export class GitHubClient {
  private accessToken: string;
  private baseUrl = "https://api.github.com";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Fetch all repositories for the authenticated user
   */
  async getRepositories(): Promise<GitHubRepository[]> {
    const repos: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const batch = await this.fetch<GitHubRepository[]>(
        `/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`
      );

      if (batch.length === 0) break;
      repos.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    return repos;
  }

  /**
   * Fetch commits for a specific repository
   */
  async getCommits(
    owner: string,
    repo: string,
    options?: {
      since?: string;
      until?: string;
      per_page?: number;
    }
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    if (options?.since) params.append("since", options.since);
    if (options?.until) params.append("until", options.until);
    params.append("per_page", String(options?.per_page || 100));

    const commits = await this.fetch<GitHubCommit[]>(
      `/repos/${owner}/${repo}/commits?${params.toString()}`
    );

    // Fetch detailed stats for each commit
    const detailedCommits = await Promise.all(
      commits.map(async (commit) => {
        try {
          const detailed = await this.fetch<GitHubCommit>(
            `/repos/${owner}/${repo}/commits/${commit.sha}`
          );
          return detailed;
        } catch (error) {
          console.error(`Error fetching commit ${commit.sha}:`, error);
          return commit;
        }
      })
    );

    return detailedCommits;
  }

  /**
   * Fetch branches for a specific repository
   */
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    return this.fetch<GitHubBranch[]>(`/repos/${owner}/${repo}/branches`);
  }

  /**
   * Fetch repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.fetch<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  /**
   * Fetch directory contents or file info at a given path
   */
  async getContents(
    owner: string,
    repo: string,
    path = "",
    ref?: string
  ): Promise<GitHubContent[]> {
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const result = await this.fetch<GitHubContent | GitHubContent[]>(
      `/repos/${owner}/${repo}/contents/${path}${query}`
    );
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Fetch the decoded content of a single file
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFileContent> {
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return this.fetch<GitHubFileContent>(
      `/repos/${owner}/${repo}/contents/${path}${query}`
    );
  }

  /**
   * Fetch user's profile information
   */
  async getUser(): Promise<{
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  }> {
    return this.fetch("/user");
  }
}
