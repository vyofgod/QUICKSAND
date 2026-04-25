import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { helpers } from "@/lib/db";
import { ReviewAction, type CodeReview } from "@/lib/db-schema";

export const reviewRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);

      const results = await db.query<[CodeReview[]]>(
        `SELECT * FROM codeReview WHERE userId = $userId ORDER BY submittedAt DESC LIMIT $limit START $offset`,
        { userId: userRecordId, limit: input.limit, offset: input.offset }
      );
      return results[0] ?? [];
    }),

  analytics: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);

      const now = new Date();
      const periodDays: Record<string, number> = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };
      const since = new Date(
        now.getTime() - periodDays[input.period] * 24 * 60 * 60 * 1000
      );

      const [totalResult, byActionResult, byRepoResult, timelineResult] =
        await Promise.all([
          db.query<[{ count: number }[]]>(
            `SELECT count() AS count FROM codeReview WHERE userId = $userId AND submittedAt >= $since GROUP ALL`,
            { userId: userRecordId, since }
          ),
          db.query<[{ action: ReviewAction; count: number }[]]>(
            `SELECT action, count() AS count FROM codeReview WHERE userId = $userId AND submittedAt >= $since GROUP BY action`,
            { userId: userRecordId, since }
          ),
          db.query<[{ repositoryId: unknown; count: number }[]]>(
            `SELECT repositoryId, count() AS count FROM codeReview WHERE userId = $userId AND submittedAt >= $since GROUP BY repositoryId ORDER BY count DESC LIMIT 5`,
            { userId: userRecordId, since }
          ),
          db.query<[{ date: string; count: number }[]]>(
            `SELECT time::format(submittedAt, "%Y-%m-%d") AS date, count() AS count FROM codeReview WHERE userId = $userId AND submittedAt >= $since GROUP BY date ORDER BY date ASC`,
            { userId: userRecordId, since }
          ),
        ]);

      const total = totalResult[0]?.[0]?.count ?? 0;
      const byAction = byActionResult[0] ?? [];
      const byRepo = byRepoResult[0] ?? [];
      const timeline = timelineResult[0] ?? [];

      const approved =
        byAction.find((a) => a.action === ReviewAction.APPROVED)?.count ?? 0;
      const changesRequested =
        byAction.find((a) => a.action === ReviewAction.CHANGES_REQUESTED)
          ?.count ?? 0;
      const commented =
        byAction.find((a) => a.action === ReviewAction.COMMENTED)?.count ?? 0;

      return {
        total,
        approved,
        changesRequested,
        commented,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        byRepo,
        timeline,
      };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        pullRequestId: z.string(),
        repositoryId: z.string(),
        action: z.nativeEnum(ReviewAction),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);

      const result = await db.query<[CodeReview[]]>(
        `CREATE codeReview SET
          userId = $userId,
          pullRequestId = $prId,
          repositoryId = $repoId,
          action = $action,
          comment = $comment,
          submittedAt = time::now(),
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId: userRecordId,
          prId: helpers.recordId(
            "pullRequest",
            helpers.extractId(input.pullRequestId)
          ),
          repoId: helpers.recordId(
            "repository",
            helpers.extractId(input.repositoryId)
          ),
          action: input.action,
          comment: input.comment ?? null,
        }
      );

      return result[0]?.[0] ?? null;
    }),

  weeklyReport: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await db.query<[{ date: string; count: number }[]]>(
      `SELECT time::format(submittedAt, "%Y-%m-%d") AS date, count() AS count
       FROM codeReview WHERE userId = $userId AND submittedAt >= $since
       GROUP BY date ORDER BY date ASC`,
      { userId: userRecordId, since: weekAgo }
    );

    return results[0] ?? [];
  }),
});
