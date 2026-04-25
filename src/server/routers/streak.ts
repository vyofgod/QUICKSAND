import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { helpers } from "@/lib/db";
import {
  AchievementType,
  type CommitStreak,
  type Achievement,
} from "@/lib/db-schema";

const ACHIEVEMENT_THRESHOLDS: Array<{
  type: AchievementType;
  check: (streak: CommitStreak) => boolean;
}> = [
  { type: AchievementType.COMMITS_10, check: (s) => s.totalCommits >= 10 },
  { type: AchievementType.COMMITS_100, check: (s) => s.totalCommits >= 100 },
  { type: AchievementType.COMMITS_1000, check: (s) => s.totalCommits >= 1000 },
  { type: AchievementType.PRS_10, check: (s) => s.totalPRs >= 10 },
  { type: AchievementType.PRS_50, check: (s) => s.totalPRs >= 50 },
  { type: AchievementType.REVIEWS_10, check: (s) => s.totalReviews >= 10 },
  { type: AchievementType.REVIEWS_50, check: (s) => s.totalReviews >= 50 },
  { type: AchievementType.STREAK_7, check: (s) => s.longestStreak >= 7 },
  { type: AchievementType.STREAK_30, check: (s) => s.longestStreak >= 30 },
  { type: AchievementType.STREAK_100, check: (s) => s.longestStreak >= 100 },
];

export const streakRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const results = await db.query<[CommitStreak[]]>(
      `SELECT * FROM commitStreak WHERE userId = $userId LIMIT 1`,
      { userId: userRecordId }
    );

    if (results[0]?.[0]) return results[0][0];

    // Initialize streak record
    const created = await db.query<[CommitStreak[]]>(
      `CREATE commitStreak SET
        userId = $userId,
        currentStreak = 0,
        longestStreak = 0,
        totalCommits = 0,
        totalPRs = 0,
        totalReviews = 0,
        weeklyContributions = {},
        createdAt = time::now(),
        updatedAt = time::now()`,
      { userId: userRecordId }
    );
    return created[0]?.[0] ?? null;
  }),

  achievements: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const results = await db.query<[Achievement[]]>(
      `SELECT * FROM achievement WHERE userId = $userId ORDER BY unlockedAt DESC`,
      { userId: userRecordId }
    );
    return results[0] ?? [];
  }),

  contributions: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "year"]).default("year"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);

      const now = new Date();
      let since: Date;
      if (input.period === "week") {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.period === "month") {
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      const results = await db.query<
        [{ date: string; count: number }[]]
      >(
        `SELECT time::format(occurredAt, "%Y-%m-%d") AS date, count() AS count
         FROM activityLog
         WHERE userId = $userId AND occurredAt >= $since AND type = "COMMIT"
         GROUP BY date
         ORDER BY date ASC`,
        { userId: userRecordId, since }
      );

      return results[0] ?? [];
    }),

  recalculate: protectedProcedure.mutation(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    // Count commits from activity log
    const [commitResult, prResult, reviewResult] = await Promise.all([
      db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM activityLog WHERE userId = $userId AND type = "COMMIT" GROUP ALL`,
        { userId: userRecordId }
      ),
      db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM pullRequest WHERE userId = $userId GROUP ALL`,
        { userId: userRecordId }
      ),
      db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM codeReview WHERE userId = $userId GROUP ALL`,
        { userId: userRecordId }
      ),
    ]);

    const totalCommits = commitResult[0]?.[0]?.count ?? 0;
    const totalPRs = prResult[0]?.[0]?.count ?? 0;
    const totalReviews = reviewResult[0]?.[0]?.count ?? 0;

    // Calculate streak from daily commit dates
    const commitDates = await db.query<[{ date: string }[]]>(
      `SELECT DISTINCT time::format(occurredAt, "%Y-%m-%d") AS date
       FROM activityLog WHERE userId = $userId AND type = "COMMIT"
       ORDER BY date DESC`,
      { userId: userRecordId }
    );
    const dates = (commitDates[0] ?? []).map((r) => r.date).sort().reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let prevDate: string | null = null;

    for (const dateStr of dates) {
      if (!prevDate) {
        streak = 1;
      } else {
        const prev = new Date(prevDate);
        const curr = new Date(dateStr);
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
        } else {
          streak = 1;
        }
      }
      if (streak > longestStreak) longestStreak = streak;
      prevDate = dateStr;
    }

    // currentStreak: streak from today backwards
    const today = new Date().toISOString().split("T")[0];
    if (dates[0] === today || dates[0] === getPrevDay(today)) {
      currentStreak = streak;
    }

    const existingResults = await db.query<[CommitStreak[]]>(
      `SELECT * FROM commitStreak WHERE userId = $userId LIMIT 1`,
      { userId: userRecordId }
    );
    const existing = existingResults[0]?.[0];

    const streakData = {
      userId: userRecordId,
      currentStreak,
      longestStreak,
      totalCommits,
      totalPRs,
      totalReviews,
      lastCommitDate: dates[0] ? new Date(dates[0]) : null,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.query(
        `UPDATE commitStreak SET
          currentStreak = $currentStreak,
          longestStreak = $longestStreak,
          totalCommits = $totalCommits,
          totalPRs = $totalPRs,
          totalReviews = $totalReviews,
          lastCommitDate = $lastCommitDate,
          updatedAt = time::now()
        WHERE userId = $userId`,
        { ...streakData, userId: userRecordId }
      );
    } else {
      await db.query(
        `CREATE commitStreak SET
          userId = $userId,
          currentStreak = $currentStreak,
          longestStreak = $longestStreak,
          totalCommits = $totalCommits,
          totalPRs = $totalPRs,
          totalReviews = $totalReviews,
          lastCommitDate = $lastCommitDate,
          weeklyContributions = {},
          createdAt = time::now(),
          updatedAt = time::now()`,
        streakData
      );
    }

    // Check and unlock achievements
    const updatedStreak = { ...streakData, weeklyContributions: {} } as CommitStreak;
    const existingAchievements = await db.query<[Achievement[]]>(
      `SELECT type FROM achievement WHERE userId = $userId`,
      { userId: userRecordId }
    );
    const unlockedTypes = new Set(
      (existingAchievements[0] ?? []).map((a) => a.type)
    );

    for (const { type, check } of ACHIEVEMENT_THRESHOLDS) {
      if (!unlockedTypes.has(type) && check(updatedStreak)) {
        await db.query(
          `CREATE achievement SET userId = $userId, type = $type, unlockedAt = time::now(), createdAt = time::now(), updatedAt = time::now()`,
          { userId: userRecordId, type }
        );
      }
    }

    return { currentStreak, longestStreak, totalCommits, totalPRs, totalReviews };
  }),
});

function getPrevDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
