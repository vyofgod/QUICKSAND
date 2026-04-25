import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { helpers } from "@/lib/db";
import { type Account } from "@/lib/db-schema";

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: "open" | "closed";
  user: { login: string; avatar_url: string };
  assignees: Array<{ login: string }>;
  labels: Array<{ name: string; color: string }>;
  milestone?: { title: string; due_on?: string };
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  pull_request?: unknown;
}

interface StoredIssue {
  id: unknown;
  repositoryId: unknown;
  userId: unknown;
  externalId: string;
  number: number;
  title: string;
  description?: string;
  state: string;
  author: string;
  authorAvatar?: string;
  assignees: string[];
  labels: string[];
  milestone?: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export const issueRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        state: z.enum(["open", "closed", "all"]).default("open"),
        repoId: z.string().optional(),
        label: z.string().optional(),
        milestone: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);

      let query = `SELECT * FROM issue WHERE userId = $userId`;
      const params: Record<string, unknown> = { userId: userRecordId };

      if (input.state !== "all") {
        query += ` AND state = $state`;
        params.state = input.state;
      }

      if (input.repoId) {
        query += ` AND repositoryId = $repoId`;
        params.repoId = helpers.recordId(
          "repository",
          helpers.extractId(input.repoId)
        );
      }

      if (input.label) {
        query += ` AND labels CONTAINS $label`;
        params.label = input.label;
      }

      query += ` ORDER BY createdAt DESC LIMIT $limit START $offset`;
      params.limit = input.limit;
      params.offset = input.offset;

      const results = await db.query<[StoredIssue[]]>(query, params);
      return results[0] ?? [];
    }),

  labels: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const results = await db.query<[{ label: string }[]]>(
      `SELECT VALUE array::flatten(labels) AS label FROM issue WHERE userId = $userId GROUP ALL`,
      { userId: userRecordId }
    );
    const flat = results[0] ?? [];
    const counts: Record<string, number> = {};
    for (const item of flat) {
      const lbl = item.label;
      counts[lbl] = (counts[lbl] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }),

  milestones: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const results = await db.query<[{ milestone: string; count: number }[]]>(
      `SELECT milestone, count() AS count FROM issue WHERE userId = $userId AND milestone != NONE GROUP BY milestone`,
      { userId: userRecordId }
    );
    return results[0] ?? [];
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
      const account = accounts.find(
        (a) => a.provider === repo.provider.toLowerCase()
      );
      const token = account?.access_token;
      if (!token) continue;

      try {
        const [owner, repoName] = repo.fullName.split("/");

        if (repo.provider.toLowerCase() === "github") {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/issues?state=all&per_page=50&filter=all`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": "DevFocus",
              },
            }
          );
          if (!response.ok) continue;
          const issues: GitHubIssue[] = await response.json();

          for (const issue of issues) {
            // Skip pull requests
            if (issue.pull_request) continue;

            await db.query(
              `UPSERT issue SET
                repositoryId = $repoId,
                userId = $userId,
                externalId = $externalId,
                number = $number,
                title = $title,
                description = $description,
                state = $state,
                author = $author,
                authorAvatar = $authorAvatar,
                assignees = $assignees,
                labels = $labels,
                milestone = $milestone,
                url = $url,
                closedAt = $closedAt,
                createdAt = $createdAt,
                updatedAt = $updatedAt
              WHERE externalId = $externalId AND repositoryId = $repoId`,
              {
                repoId: repo.id,
                userId: userRecordId,
                externalId: String(issue.id),
                number: issue.number,
                title: issue.title,
                description: issue.body ?? null,
                state: issue.state,
                author: issue.user?.login ?? "unknown",
                authorAvatar: issue.user?.avatar_url ?? null,
                assignees: (issue.assignees ?? []).map((a) => a.login),
                labels: (issue.labels ?? []).map((l) => l.name),
                milestone: issue.milestone?.title ?? null,
                url: issue.html_url,
                closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
                createdAt: new Date(issue.created_at),
                updatedAt: new Date(issue.updated_at),
              }
            );
            synced++;
          }
        }
      } catch {
        // Skip failed repos
      }
    }

    return { synced };
  }),
});
