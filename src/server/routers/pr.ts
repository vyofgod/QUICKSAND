import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { helpers } from "@/lib/db";
import { PRState, type PullRequest, type Account } from "@/lib/db-schema";

export const prRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        state: z.enum(["open", "closed", "merged", "all"]).default("open"),
        role: z.enum(["author", "reviewer", "all"]).default("all"),
        repoId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);

      let query = `SELECT * FROM pullRequest WHERE userId = $userId`;
      const params: Record<string, unknown> = { userId: userRecordId };

      if (input.state !== "all") {
        const stateMap: Record<string, PRState> = {
          open: PRState.OPEN,
          closed: PRState.CLOSED,
          merged: PRState.MERGED,
        };
        query += ` AND state = $state`;
        params.state = stateMap[input.state];
      }

      if (input.repoId) {
        const repoRecordId = helpers.recordId(
          "repository",
          helpers.extractId(input.repoId)
        );
        query += ` AND repositoryId = $repoId`;
        params.repoId = repoRecordId;
      }

      query += ` ORDER BY createdAt DESC LIMIT $limit START $offset`;
      params.limit = input.limit;
      params.offset = input.offset;

      const results = await db.query<[PullRequest[]]>(query, params);
      return results[0] ?? [];
    }),

  pendingReviews: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const accountResults = await db.query<[Account[]]>(
      `SELECT providerUsername FROM account WHERE userId = $userId`,
      { userId: userRecordId }
    );
    const usernames = (accountResults[0] ?? [])
      .map((a) => a.providerUsername)
      .filter(Boolean);

    if (usernames.length === 0) return [];

    const results = await db.query<[PullRequest[]]>(
      `SELECT * FROM pullRequest WHERE userId = $userId AND state = $state AND requestedReviewers CONTAINSANY $usernames ORDER BY createdAt DESC LIMIT 20`,
      { userId: userRecordId, state: PRState.OPEN, usernames }
    );
    return results[0] ?? [];
  }),

  metrics: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const [openResult, mergedResult] = await Promise.all([
      db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM pullRequest WHERE userId = $userId AND state = $state GROUP ALL`,
        { userId: userRecordId, state: PRState.OPEN }
      ),
      db.query<[PullRequest[]]>(
        `SELECT createdAt, mergedAt FROM pullRequest WHERE userId = $userId AND state = $state AND mergedAt != NONE LIMIT 100`,
        { userId: userRecordId, state: PRState.MERGED }
      ),
    ]);

    const openCount = openResult[0]?.[0]?.count ?? 0;
    const mergedPRs = mergedResult[0] ?? [];
    const avgMergeTimeMs =
      mergedPRs.length > 0
        ? mergedPRs.reduce((sum, pr) => {
            const created = new Date(pr.createdAt).getTime();
            const merged = new Date(pr.mergedAt!).getTime();
            return sum + (merged - created);
          }, 0) / mergedPRs.length
        : 0;

    return {
      openCount,
      mergedCount: mergedPRs.length,
      avgMergeTimeHours: Math.round(avgMergeTimeMs / (1000 * 60 * 60)),
    };
  }),

  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const accountResults = await db.query<[Account[]]>(
      `SELECT * FROM account WHERE userId = $userId`,
      { userId: userRecordId }
    );
    const accounts = accountResults[0] ?? [];

    const repoResults = await db.query<
      [{ id: unknown; externalId: string; provider: string; fullName: string }[]]
    >(
      `SELECT id, externalId, provider, fullName FROM repository WHERE userId = $userId`,
      { userId: userRecordId }
    );
    const repos = repoResults[0] ?? [];

    let synced = 0;

    for (const repo of repos) {
      const account = accounts.find((a) => a.provider === repo.provider.toLowerCase());
      const token = account?.access_token;
      if (!token) continue;

      try {
        const [owner, repoName] = repo.fullName.split("/");
        let prs: Array<{
          id: string;
          number: number;
          title: string;
          body?: string;
          state: string;
          draft: boolean;
          user: { login: string; avatar_url: string };
          requested_reviewers: Array<{ login: string }>;
          labels: Array<{ name: string }>;
          head: { ref: string };
          base: { ref: string };
          html_url: string;
          additions?: number;
          deletions?: number;
          changed_files?: number;
          merged_at?: string;
          closed_at?: string;
          created_at: string;
          updated_at: string;
        }> = [];

        if (repo.provider.toLowerCase() === "github") {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/pulls?state=all&per_page=30`,
            { headers: { Authorization: `Bearer ${token}`, "User-Agent": "DevFocus" } }
          );
          if (response.ok) prs = await response.json();
        }

        for (const pr of prs) {
          const stateMap: Record<string, PRState> = {
            open: pr.draft ? PRState.DRAFT : PRState.OPEN,
            closed: pr.merged_at ? PRState.MERGED : PRState.CLOSED,
          };

          await db.query(
            `UPSERT pullRequest SET
              repositoryId = $repoId,
              userId = $userId,
              externalId = $externalId,
              number = $number,
              title = $title,
              description = $description,
              state = $state,
              isDraft = $isDraft,
              author = $author,
              authorAvatar = $authorAvatar,
              reviewers = $reviewers,
              requestedReviewers = $requestedReviewers,
              labels = $labels,
              sourceBranch = $sourceBranch,
              targetBranch = $targetBranch,
              url = $url,
              hasConflicts = false,
              additions = $additions,
              deletions = $deletions,
              changedFiles = $changedFiles,
              mergedAt = $mergedAt,
              closedAt = $closedAt,
              lastSyncedAt = time::now(),
              createdAt = $createdAt,
              updatedAt = $updatedAt
            WHERE externalId = $externalId AND repositoryId = $repoId`,
            {
              repoId: repo.id,
              userId: userRecordId,
              externalId: String(pr.id),
              number: pr.number,
              title: pr.title,
              description: pr.body ?? null,
              state: stateMap[pr.state] ?? PRState.OPEN,
              isDraft: pr.draft ?? false,
              author: pr.user?.login ?? "unknown",
              authorAvatar: pr.user?.avatar_url ?? null,
              reviewers: [],
              requestedReviewers: (pr.requested_reviewers ?? []).map(
                (r) => r.login
              ),
              labels: (pr.labels ?? []).map((l) => l.name),
              sourceBranch: pr.head?.ref ?? "",
              targetBranch: pr.base?.ref ?? "",
              url: pr.html_url,
              additions: pr.additions ?? 0,
              deletions: pr.deletions ?? 0,
              changedFiles: pr.changed_files ?? 0,
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
              closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
              createdAt: new Date(pr.created_at),
              updatedAt: new Date(pr.updated_at),
            }
          );
          synced++;
        }
      } catch {
        // Skip repos that fail to sync
      }
    }

    return { synced };
  }),
});
