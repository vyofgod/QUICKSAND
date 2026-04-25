/**
 * Repository Synchronization Service - SurrealDB version
 * Handles syncing repositories and commits from GitHub/GitLab
 */

import { db, helpers } from "@/lib/db";
import { GitHubClient, type GitHubRepository } from "./github";
import { GitLabClient, type GitLabProject } from "./gitlab";
import {
  ActivitySource,
  SyncStatus,
  type Repository,
  type RepositoryBranch,
  type RepositoryCommit,
} from "@/lib/db-schema";

export interface SyncResult {
  success: boolean;
  repositoriesAdded: number;
  repositoriesUpdated: number;
  commitsAdded: number;
  errors: string[];
}

export class RepositorySyncService {
  /**
   * Sync all repositories for a user from GitHub
   */
  static async syncGitHubRepositories(
    userId: string,
    accessToken: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      repositoriesAdded: 0,
      repositoriesUpdated: 0,
      commitsAdded: 0,
      errors: [],
    };

    try {
      const client = new GitHubClient(accessToken);
      const repos = await client.getRepositories();
      const userRecordId = helpers.recordId("user", userId);

      for (const repo of repos) {
        try {
          const isNew = await this.syncGitHubRepository(
            userRecordId,
            repo,
            client,
            result
          );

          if (isNew) {
            result.repositoriesAdded++;
          } else {
            result.repositoriesUpdated++;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const errorStack = error instanceof Error ? error.stack : "";
          console.error(
            `Error syncing repo ${repo.full_name}:`,
            errorMessage,
            errorStack
          );
          result.errors.push(
            `Error syncing repo ${repo.full_name}: ${errorMessage}`
          );
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(
        `GitHub sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  /**
   * Sync a single GitHub repository
   */
  private static async syncGitHubRepository(
    userId: string,
    repo: GitHubRepository,
    client: GitHubClient,
    result?: SyncResult
  ): Promise<boolean> {
    const [owner, repoName] = repo.full_name.split("/");

    // Check if repository exists
    const existingResults = await db.query<[Repository[]]>(
      `SELECT * FROM repository WHERE userId = $userId AND provider = $provider AND externalId = $externalId LIMIT 1`,
      { userId, provider: ActivitySource.GITHUB, externalId: String(repo.id) }
    );

    const existing = existingResults[0]?.[0];
    const isNew = !existing;

    const repoData = {
      userId,
      externalId: String(repo.id),
      provider: ActivitySource.GITHUB,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      watchers: repo.watchers_count,
      language: repo.language,
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      isPrivate: repo.private,
      isFork: repo.fork,
      isArchived: repo.archived,
      ownerName: repo.owner.login,
      ownerAvatar: repo.owner.avatar_url,
      pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : undefined,
      lastSyncedAt: new Date(),
      syncStatus: SyncStatus.SYNCED,
      updatedAt: new Date(),
    };

    let repository: Repository;

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (db as any).merge(existing.id, repoData) as Repository;
      repository = Array.isArray(result) ? result[0] : result;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (db as any).create("repository", {
        ...repoData,
        createdAt: new Date(repo.created_at),
      });
      repository = Array.isArray(result) ? result[0] : result;
    }

    // Sync branches
    try {
      const branches = await client.getBranches(owner, repoName);
      const branchesArray = Array.isArray(branches) ? branches : [];

      for (const branch of branchesArray) {
        const branchResults = await db.query<[RepositoryBranch[]]>(
          `SELECT * FROM repositoryBranch WHERE repositoryId = $repositoryId AND name = $name LIMIT 1`,
          { repositoryId: repository.id, name: branch.name }
        );

        const existingBranch = branchResults[0]?.[0];

        const branchData = {
          repositoryId: repository.id,
          name: branch.name,
          isProtected: branch.protected,
          lastCommitSha: branch.commit.sha,
          updatedAt: new Date(),
        };

        if (existingBranch) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).merge(existingBranch.id, branchData);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).create("repositoryBranch", {
            ...branchData,
            isDefault: false,
            createdAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Error syncing branches for ${repo.full_name}:`, error);
    }

    // Sync recent commits (last 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const commits = await client.getCommits(owner, repoName, {
        since: thirtyDaysAgo.toISOString(),
        per_page: 50,
      });

      const commitsArray = Array.isArray(commits) ? commits : [];

      for (const commit of commitsArray) {
        const commitResults = await db.query<[RepositoryCommit[]]>(
          `SELECT * FROM repositoryCommit WHERE repositoryId = $repositoryId AND sha = $sha LIMIT 1`,
          { repositoryId: repository.id, sha: commit.sha }
        );

        const existingCommit = commitResults[0]?.[0];

        const commitData = {
          repositoryId: repository.id,
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          authorEmail: commit.commit.author.email,
          authorAvatar: commit.author?.avatar_url,
          additions: commit.stats?.additions || 0,
          deletions: commit.stats?.deletions || 0,
          changedFiles: Array.isArray(commit.files) ? commit.files.length : 0,
          url: commit.html_url,
          committedAt: new Date(commit.commit.author.date),
          updatedAt: new Date(),
        };

        if (existingCommit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).merge(existingCommit.id, commitData);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).create("repositoryCommit", {
            ...commitData,
            createdAt: new Date(),
          });
          if (result) {
            result.commitsAdded++;
          }
        }
      }
    } catch (error) {
      console.error(`Error syncing commits for ${repo.full_name}:`, error);
    }

    return isNew;
  }

  /**
   * Sync all repositories for a user from GitLab
   */
  static async syncGitLabRepositories(
    userId: string,
    accessToken: string,
    baseUrl?: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      repositoriesAdded: 0,
      repositoriesUpdated: 0,
      commitsAdded: 0,
      errors: [],
    };

    try {
      const client = new GitLabClient(accessToken, baseUrl);
      const projects = await client.getProjects();
      const userRecordId = helpers.recordId("user", userId);

      for (const project of projects) {
        try {
          const isNew = await this.syncGitLabProject(
            userRecordId,
            project,
            client
          );

          if (isNew) {
            result.repositoriesAdded++;
          } else {
            result.repositoriesUpdated++;
          }
        } catch (error) {
          result.errors.push(
            `Error syncing project ${project.path_with_namespace}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(
        `GitLab sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  /**
   * Sync a single GitLab project
   */
  private static async syncGitLabProject(
    userId: string,
    project: GitLabProject,
    client: GitLabClient
  ): Promise<boolean> {
    // Check if repository exists
    const existingResults = await db.query<[Repository[]]>(
      `SELECT * FROM repository WHERE userId = $userId AND provider = $provider AND externalId = $externalId LIMIT 1`,
      {
        userId,
        provider: ActivitySource.GITLAB,
        externalId: String(project.id),
      }
    );

    const existing = existingResults[0]?.[0];
    const isNew = !existing;

    const repoData = {
      userId,
      externalId: String(project.id),
      provider: ActivitySource.GITLAB,
      name: project.name,
      fullName: project.path_with_namespace,
      description: project.description,
      url: project.web_url,
      homepage: project.homepage,
      stars: project.star_count,
      forks: project.forks_count,
      openIssues: project.open_issues_count,
      watchers: 0,
      language: undefined,
      topics: Array.isArray(project.topics) ? project.topics : [],
      isPrivate: project.visibility === "private",
      isFork: !!project.forked_from_project,
      isArchived: project.archived,
      ownerName: project.namespace.name,
      ownerAvatar: project.namespace.avatar_url,
      pushedAt: new Date(project.last_activity_at),
      lastSyncedAt: new Date(),
      syncStatus: SyncStatus.SYNCED,
      updatedAt: new Date(),
    };

    let repository: Repository;

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (db as any).merge(existing.id, repoData) as Repository;
      repository = Array.isArray(result) ? result[0] : result;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (db as any).create("repository", {
        ...repoData,
        createdAt: new Date(project.created_at),
      });
      repository = Array.isArray(result) ? result[0] : result;
    }

    // Sync branches
    try {
      const branches = await client.getBranches(project.id);
      const branchesArray = Array.isArray(branches) ? branches : [];

      for (const branch of branchesArray) {
        const branchResults = await db.query<[RepositoryBranch[]]>(
          `SELECT * FROM repositoryBranch WHERE repositoryId = $repositoryId AND name = $name LIMIT 1`,
          { repositoryId: repository.id, name: branch.name }
        );

        const existingBranch = branchResults[0]?.[0];

        const branchData = {
          repositoryId: repository.id,
          name: branch.name,
          isDefault: branch.default,
          isProtected: branch.protected,
          lastCommitSha: branch.commit.id,
          lastCommitMessage: branch.commit.title,
          lastCommitDate: new Date(branch.commit.created_at),
          updatedAt: new Date(),
        };

        if (existingBranch) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).merge(existingBranch.id, branchData);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).create("repositoryBranch", {
            ...branchData,
            createdAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(
        `Error syncing branches for ${project.path_with_namespace}:`,
        error
      );
    }

    // Sync recent commits (last 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const commits = await client.getCommits(project.id, {
        since: thirtyDaysAgo.toISOString(),
        per_page: 50,
      });

      const commitsArray = Array.isArray(commits) ? commits : [];

      for (const commit of commitsArray) {
        const commitResults = await db.query<[RepositoryCommit[]]>(
          `SELECT * FROM repositoryCommit WHERE repositoryId = $repositoryId AND sha = $sha LIMIT 1`,
          { repositoryId: repository.id, sha: commit.id }
        );

        const existingCommit = commitResults[0]?.[0];

        const commitData = {
          repositoryId: repository.id,
          sha: commit.id,
          message: commit.message,
          author: commit.author_name,
          authorEmail: commit.author_email,
          authorAvatar: undefined,
          additions: commit.stats?.additions || 0,
          deletions: commit.stats?.deletions || 0,
          changedFiles: 0,
          url: commit.web_url,
          committedAt: new Date(commit.committed_date),
          updatedAt: new Date(),
        };

        if (existingCommit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).merge(existingCommit.id, commitData);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).create("repositoryCommit", {
            ...commitData,
            createdAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(
        `Error syncing commits for ${project.path_with_namespace}:`,
        error
      );
    }

    return isNew;
  }
}
