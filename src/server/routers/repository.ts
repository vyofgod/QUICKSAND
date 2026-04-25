/**
 * Repository tRPC Router - SurrealDB version
 * Handles repository-related operations
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { RepositorySyncService } from "@/lib/integrations/repository-sync";
import { GitHubClient } from "@/lib/integrations/github";
import { GitLabClient } from "@/lib/integrations/gitlab";
import {
  ActivitySource,
  type Repository,
  type RepositoryCommit,
  type RepositoryBranch,
  type Account,
} from "@/lib/db-schema";
import { helpers } from "@/lib/db";

async function getRepoAndToken(
  db: any,
  userId: string,
  repositoryId: string
): Promise<{ repo: Repository; accessToken: string }> {
  const userRecordId = helpers.recordId("user", userId);
  const rawId = helpers.extractId(repositoryId);

  const repoResults = await db.query<[Repository[]]>(
    `SELECT * FROM type::thing("repository", $id) LIMIT 1`,
    { id: rawId }
  );
  const repo = repoResults[0]?.[0];

  if (!repo || String(repo.userId) !== String(userRecordId)) {
    throw new Error("Repository not found");
  }

  const providerStr =
    repo.provider === ActivitySource.GITHUB ? "github" : "gitlab";
  const accountResults = await db.query<[Account[]]>(
    `SELECT * FROM account WHERE userId = $userId AND provider = $provider LIMIT 1`,
    { userId: userRecordId, provider: providerStr }
  );
  let accessToken = accountResults[0]?.[0]?.access_token;

  if (!accessToken) {
    accessToken =
      repo.provider === ActivitySource.GITHUB
        ? process.env.GITHUB_PERSONAL_ACCESS_TOKEN
        : process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
  }

  if (!accessToken) {
    throw new Error(
      `No access token for ${providerStr}. Please connect your account or set the token in .env`
    );
  }

  return { repo, accessToken };
}

export const repositoryRouter = createTRPCRouter({
  /**
   * Get all repositories for the current user
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          provider: z.nativeEnum(ActivitySource).optional(),
          includeArchived: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);

      let query = `SELECT * FROM repository WHERE userId = $userId`;
      const params: Record<string, any> = { userId };

      if (input?.provider) {
        query += ` AND provider = $provider`;
        params.provider = input.provider;
      }

      if (!input?.includeArchived) {
        query += ` AND isArchived = false`;
      }

      query += ` ORDER BY updatedAt DESC LIMIT 100`;

      const results = await ctx.db.query<[Repository[]]>(query, params);
      const repos = results[0] ?? [];

      // Get counts for each repository
      const reposWithCounts = await Promise.all(
        repos.map(async (repo) => {
          const [commitsResults, branchesResults] = await Promise.all([
            ctx.db.query<[RepositoryCommit[]]>(
              `SELECT * FROM repositoryCommit WHERE repositoryId = $repoId`,
              { repoId: repo.id }
            ),
            ctx.db.query<[RepositoryBranch[]]>(
              `SELECT * FROM repositoryBranch WHERE repositoryId = $repoId`,
              { repoId: repo.id }
            ),
          ]);

          return {
            ...repo,
            _count: {
              commits: commitsResults[0]?.length ?? 0,
              branches: branchesResults[0]?.length ?? 0,
            },
          };
        })
      );

      return reposWithCounts;
    }),

  /**
   * Get a single repository by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const repoRawId = helpers.extractId(input.id);

      // db.select(string) treats the string as a table name in surrealdb.js v1.x,
      // so we use type::thing() to properly select by record ID.
      const repoResults = await ctx.db.query<[Repository[]]>(
        `SELECT * FROM type::thing("repository", $id) LIMIT 1`,
        { id: repoRawId }
      );
      const repo = repoResults[0]?.[0];

      if (!repo || String(repo.userId) !== String(userId)) {
        return null;
      }

      const [branchesResults, commitsResults] = await Promise.all([
        ctx.db.query<[RepositoryBranch[]]>(
          `SELECT * FROM repositoryBranch WHERE repositoryId = $repoId ORDER BY isDefault DESC`,
          { repoId: repo.id }
        ),
        ctx.db.query<[RepositoryCommit[]]>(
          `SELECT * FROM repositoryCommit WHERE repositoryId = $repoId`,
          { repoId: repo.id }
        ),
      ]);

      return {
        ...repo,
        branches: branchesResults[0] ?? [],
        _count: {
          commits: commitsResults[0]?.length ?? 0,
        },
      };
    }),

  /**
   * Get commits for a repository
   */
  getCommits: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const repoRawId = helpers.extractId(input.repositoryId);
      const repositoryId = helpers.recordId("repository", repoRawId);

      // Verify repository belongs to user
      const repoResults = await ctx.db.query<[Repository[]]>(
        `SELECT * FROM type::thing("repository", $id) LIMIT 1`,
        { id: repoRawId }
      );
      const repo = repoResults[0]?.[0];

      if (!repo || String(repo.userId) !== String(userId)) {
        throw new Error("Repository not found");
      }

      const [commitsResults, totalResults] = await Promise.all([
        ctx.db.query<[RepositoryCommit[]]>(
          `SELECT * FROM repositoryCommit WHERE repositoryId = type::thing("repository", $repoRawId) ORDER BY committedAt DESC LIMIT $limit START $offset`,
          { repoRawId, limit: input.limit, offset: input.offset }
        ),
        ctx.db.query<[RepositoryCommit[]]>(
          `SELECT * FROM repositoryCommit WHERE repositoryId = type::thing("repository", $repoRawId)`,
          { repoRawId }
        ),
      ]);

      const commits = commitsResults[0] ?? [];
      const total = totalResults[0]?.length ?? 0;

      return {
        commits,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get repository statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);

    const reposResults = await ctx.db.query<[Repository[]]>(
      `SELECT * FROM repository WHERE userId = $userId`,
      { userId }
    );

    const repos = reposResults[0] ?? [];

    const totalRepos = repos.length;
    const githubRepos = repos.filter(
      (r) => r.provider === ActivitySource.GITHUB
    ).length;
    const gitlabRepos = repos.filter(
      (r) => r.provider === ActivitySource.GITLAB
    ).length;

    // Get commit counts for each repo
    const repoCommitCounts = await Promise.all(
      repos.map(async (repo) => {
        const results = await ctx.db.query<[RepositoryCommit[]]>(
          `SELECT * FROM repositoryCommit WHERE repositoryId = $repoId`,
          { repoId: repo.id }
        );
        return {
          id: repo.id,
          commitCount: results[0]?.length ?? 0,
        };
      })
    );

    const totalCommits = repoCommitCounts.reduce(
      (sum, r) => sum + r.commitCount,
      0
    );

    // Get recent commits (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all commits for user's repositories
    let recentCommitsCount = 0;
    for (const repo of repos) {
      const results = await ctx.db.query<[RepositoryCommit[]]>(
        `SELECT * FROM repositoryCommit WHERE repositoryId = $repoId AND committedAt >= $sevenDaysAgo`,
        { repoId: repo.id, sevenDaysAgo }
      );
      recentCommitsCount += results[0]?.length ?? 0;
    }

    const recentCommits = recentCommitsCount;

    // Most active repos
    const mostActiveRepos = repoCommitCounts
      .sort((a, b) => b.commitCount - a.commitCount)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        _count: {
          commits: r.commitCount,
        },
      }));

    // Language distribution
    const languageDistribution = repos.reduce(
      (acc, repo) => {
        if (repo.language) {
          acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalRepos,
      githubRepos,
      gitlabRepos,
      totalCommits,
      recentCommits,
      mostActiveRepos,
      languageDistribution,
    };
  }),

  /**
   * Sync repositories from GitHub
   */
  syncGitHub: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    // Try to get GitHub access token from account (OAuth)
    const accountResults = await ctx.db.query<[Account[]]>(
      `SELECT * FROM account WHERE userId = $userId AND provider = "github" LIMIT 1`,
      { userId: userRecordId }
    );

    const account = accountResults[0]?.[0];

    // Use OAuth token if available, otherwise fall back to Personal Access Token
    let accessToken = account?.access_token;

    if (!accessToken) {
      // Fall back to Personal Access Token from environment
      accessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

      if (!accessToken) {
        throw new Error(
          "GitHub account not connected. Please sign in with GitHub or add GITHUB_PERSONAL_ACCESS_TOKEN to your .env file"
        );
      }
    }

    return RepositorySyncService.syncGitHubRepositories(userId, accessToken);
  }),

  /**
   * Sync repositories from GitLab
   */
  syncGitLab: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    // Try to get GitLab access token from account (OAuth)
    const accountResults = await ctx.db.query<[Account[]]>(
      `SELECT * FROM account WHERE userId = $userId AND provider = "gitlab" LIMIT 1`,
      { userId: userRecordId }
    );

    const account = accountResults[0]?.[0];

    // Use OAuth token if available, otherwise fall back to Personal Access Token
    let accessToken = account?.access_token;

    if (!accessToken) {
      // Fall back to Personal Access Token from environment
      accessToken = process.env.GITLAB_PERSONAL_ACCESS_TOKEN;

      if (!accessToken) {
        throw new Error(
          "GitLab account not connected. Please sign in with GitLab or add GITLAB_PERSONAL_ACCESS_TOKEN to your .env file"
        );
      }
    }

    return RepositorySyncService.syncGitLabRepositories(userId, accessToken);
  }),

  /**
   * Sync all connected providers
   */
  syncAll: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const accountsResults = await ctx.db.query<[Account[]]>(
      `SELECT * FROM account WHERE userId = $userId AND provider IN ["github", "gitlab"]`,
      { userId: userRecordId }
    );

    const accounts = accountsResults[0] ?? [];

    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        if (account.provider === "github" && account.access_token) {
          return RepositorySyncService.syncGitHubRepositories(
            userId,
            account.access_token
          );
        } else if (account.provider === "gitlab" && account.access_token) {
          return RepositorySyncService.syncGitLabRepositories(
            userId,
            account.access_token
          );
        }
        return null;
      })
    );

    const combined = {
      success: true,
      repositoriesAdded: 0,
      repositoriesUpdated: 0,
      commitsAdded: 0,
      errors: [] as string[],
    };

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        combined.repositoriesAdded += result.value.repositoriesAdded;
        combined.repositoriesUpdated += result.value.repositoriesUpdated;
        combined.commitsAdded += result.value.commitsAdded;
        combined.errors.push(...result.value.errors);
        if (!result.value.success) {
          combined.success = false;
        }
      } else if (result.status === "rejected") {
        combined.success = false;
        combined.errors.push(result.reason?.message || "Unknown error");
      }
    });

    return combined;
  }),

  /**
   * Delete a repository
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const repoRawId = helpers.extractId(input.id);

      // Verify repository belongs to user
      const repoResults = await ctx.db.query<[Repository[]]>(
        `SELECT * FROM type::thing("repository", $id) LIMIT 1`,
        { id: repoRawId }
      );
      const repo = repoResults[0]?.[0];

      if (!repo || String(repo.userId) !== String(userId)) {
        throw new Error("Repository not found");
      }

      await ctx.db.query(`DELETE type::thing("repository", $id)`, { id: repoRawId });

      return { success: true };
    }),

  /**
   * List files/directories at a given path in the repository
   */
  getFiles: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        path: z.string().default(""),
        ref: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { repo, accessToken } = await getRepoAndToken(
        ctx.db,
        ctx.session.user.id,
        input.repositoryId
      );

      if (repo.provider === ActivitySource.GITHUB) {
        const [owner, repoName] = repo.fullName.split("/");
        const client = new GitHubClient(accessToken);
        const contents = await client.getContents(
          owner,
          repoName,
          input.path,
          input.ref
        );
        return contents.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type === "dir" ? ("dir" as const) : ("file" as const),
          size: item.size,
        }));
      } else {
        const client = new GitLabClient(accessToken);
        const tree = await client.getTree(
          repo.externalId,
          input.path,
          input.ref
        );
        return tree.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type === "tree" ? ("dir" as const) : ("file" as const),
          size: undefined as number | undefined,
        }));
      }
    }),

  /**
   * Fetch decoded content of a single file
   */
  getFileContent: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        path: z.string(),
        ref: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { repo, accessToken } = await getRepoAndToken(
        ctx.db,
        ctx.session.user.id,
        input.repositoryId
      );

      if (repo.provider === ActivitySource.GITHUB) {
        const [owner, repoName] = repo.fullName.split("/");
        const client = new GitHubClient(accessToken);
        const file = await client.getFileContent(
          owner,
          repoName,
          input.path,
          input.ref
        );
        const content =
          file.encoding === "base64"
            ? Buffer.from(file.content.replace(/\n/g, ""), "base64").toString(
                "utf-8"
              )
            : file.content;
        return { content, name: file.name, path: file.path, size: file.size };
      } else {
        const client = new GitLabClient(accessToken);
        const file = await client.getFileContent(
          repo.externalId,
          input.path,
          input.ref
        );
        const content =
          file.encoding === "base64"
            ? Buffer.from(file.content.replace(/\n/g, ""), "base64").toString(
                "utf-8"
              )
            : file.content;
        return {
          content,
          name: file.file_name,
          path: file.file_path,
          size: file.size,
        };
      }
    }),
});
