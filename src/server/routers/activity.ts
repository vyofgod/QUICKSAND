/**
 * Activity tracking router for GitHub/GitLab integration - SurrealDB version
 */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { ActivitySource, ActivityType, type ActivityLog } from "@/lib/db-schema";
import { startOfDay, subDays } from "date-fns";
import { helpers } from "@/lib/db";

export const activityRouter = createTRPCRouter({
  /**
   * Get activity logs
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          source: z.nativeEnum(ActivitySource).optional(),
          type: z.nativeEnum(ActivityType).optional(),
          days: z.number().min(1).max(90).default(7),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const startDate = startOfDay(subDays(new Date(), input?.days ?? 7));

      let query = `SELECT * FROM activityLog WHERE userId = $userId AND occurredAt >= $startDate`;
      const params: Record<string, any> = { userId, startDate };

      if (input?.source) {
        query += ` AND source = $source`;
        params.source = input.source;
      }
      if (input?.type) {
        query += ` AND type = $type`;
        params.type = input.type;
      }

      query += ` ORDER BY occurredAt DESC LIMIT $limit`;
      params.limit = input?.limit ?? 50;

      const results = await ctx.db.query<[ActivityLog[]]>(query, params);
      return results[0] ?? [];
    }),

  /**
   * Get activity statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const startDate = startOfDay(subDays(new Date(), input.days));

      const results = await ctx.db.query<[ActivityLog[]]>(
        `SELECT source, type, occurredAt FROM activityLog WHERE userId = $userId AND occurredAt >= $startDate`,
        { userId, startDate }
      );

      const activities = results[0] ?? [];

      // Aggregate by source and type
      const bySource = activities.reduce(
        (acc, activity) => {
          acc[activity.source] = (acc[activity.source] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const byType = activities.reduce(
        (acc, activity) => {
          acc[activity.type] = (acc[activity.type] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Daily breakdown
      const dailyBreakdown = activities.reduce(
        (acc, activity) => {
          const day = startOfDay(activity.occurredAt).toISOString();
          acc[day] = (acc[day] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        total: activities.length,
        bySource,
        byType,
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, count]) => ({
          date,
          count,
        })),
      };
    }),

  /**
   * Create activity log entry
   */
  create: protectedProcedure
    .input(
      z.object({
        source: z.nativeEnum(ActivitySource),
        type: z.nativeEnum(ActivityType),
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        url: z.string().url().optional(),
        metadata: z.record(z.unknown()).optional(),
        occurredAt: z.date().default(() => new Date()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);

      const [activity] = await ctx.db.create<ActivityLog>("activityLog", {
        ...input,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return activity;
    }),

  /**
   * Sync GitHub activities
   */
  syncGitHub: protectedProcedure.mutation(async () => {
    // This would integrate with GitHub API
    // For now, return a placeholder
    return {
      success: true,
      message: "GitHub sync not yet implemented",
      synced: 0,
    };
  }),

  /**
   * Sync GitLab activities
   */
  syncGitLab: protectedProcedure.mutation(async () => {
    // This would integrate with GitLab API
    // For now, return a placeholder
    return {
      success: true,
      message: "GitLab sync not yet implemented",
      synced: 0,
    };
  }),
});
