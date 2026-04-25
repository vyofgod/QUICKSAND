/**
 * User preferences and profile router - SurrealDB version
 */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { helpers } from "@/lib/db";
import type {
  User,
  UserPreferences,
  Account,
  Task,
  ActivityLog,
} from "@/lib/db-schema";

export const userRouter = createTRPCRouter({
  /**
   * Get current user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const rawId = ctx.session.user.id;

    const userResults = await ctx.db.query<[User[]]>(
      `SELECT * FROM type::thing('user', $rawId) LIMIT 1`,
      { rawId }
    );

    const user = userResults[0]?.[0];
    const sessionUser = ctx.session.user;
    const userId = helpers.recordId("user", rawId);

    // If name/image is missing in DB but present in session, sync it
    if (user && (!user.name || !user.image) && (sessionUser.name || sessionUser.image)) {
      try {
        await ctx.db.query(
          `UPDATE type::thing('user', $rawId) SET name = $name, image = $image`,
          { rawId, name: sessionUser.name ?? user.name, image: sessionUser.image ?? user.image }
        );
        if (!user.name) user.name = sessionUser.name ?? null;
        if (!user.image) user.image = sessionUser.image ?? null;
      } catch (_) {}
    }

    // If DB user not found at all, build from session data
    const effectiveUser = user ?? {
      id: rawId,
      name: sessionUser.name ?? null,
      email: sessionUser.email ?? null,
      image: sessionUser.image ?? null,
    };

    const preferencesResults = await ctx.db.query<[UserPreferences[]]>(
      `SELECT * FROM userPreferences WHERE userId = $userId LIMIT 1`,
      { userId }
    );

    const accountsResults = await ctx.db.query<[Account[]]>(
      `SELECT provider, providerAccountId, providerUsername FROM account WHERE userId = $userId`,
      { userId }
    );

    return {
      ...effectiveUser,
      preferences: preferencesResults[0]?.[0] ?? null,
      accounts: accountsResults[0] ?? [],
    };
  }),

  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);

    const results = await ctx.db.query<[UserPreferences[]]>(
      `SELECT * FROM userPreferences WHERE userId = $userId LIMIT 1`,
      { userId }
    );

    let preferences = results[0]?.[0];

    // Create default preferences if they don't exist
    if (!preferences) {
      const [created] = await ctx.db.create<UserPreferences>(
        "userPreferences",
        {
          userId,
          theme: "system",
          sidebarCollapsed: false,
          aiModel: "openai/gpt-4-turbo-preview",
          aiMaxTokens: 2000,
          aiTemperature: 0.7,
          enableNotifications: true,
          enableSoundAlerts: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
      preferences = created;
    }

    return preferences;
  }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        sidebarCollapsed: z.boolean().optional(),
        aiModel: z.string().optional(),
        aiMaxTokens: z.number().min(100).max(4000).optional(),
        aiTemperature: z.number().min(0).max(2).optional(),
        aiSystemPrompt: z.string().max(1000).optional(),
        enableNotifications: z.boolean().optional(),
        enableSoundAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);

      // Check if preferences exist
      const results = await ctx.db.query<[UserPreferences[]]>(
        `SELECT * FROM userPreferences WHERE userId = $userId LIMIT 1`,
        { userId }
      );

      const existing = results[0]?.[0];

      if (existing) {
        const [updated] = await ctx.db.merge<UserPreferences>(existing.id, {
          ...input,
          updatedAt: new Date(),
        });
        return updated;
      } else {
        const [created] = await ctx.db.create<UserPreferences>(
          "userPreferences",
          {
            userId,
            theme: "system",
            sidebarCollapsed: false,
            aiModel: "openai/gpt-4-turbo-preview",
            aiMaxTokens: 2000,
            aiTemperature: 0.7,
            enableNotifications: true,
            enableSoundAlerts: true,
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        );
        return created;
      }
    }),

  /**
   * Get full profile statistics for the profile page
   */
  getProfileStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);

    const [
      tasksResults,
      completedTasksResults,
      repoResults,
      commitResults,
      prResults,
      recentActivityResults,
    ] = await Promise.all([
      ctx.db.query<[Task[]]>(`SELECT id FROM task WHERE userId = $userId`, {
        userId,
      }),
      ctx.db.query<[Task[]]>(
        `SELECT id FROM task WHERE userId = $userId AND status = "DONE"`,
        { userId }
      ),
      ctx.db.query<[{ count: number }[]]>(
        `SELECT count() as count FROM repository WHERE userId = $userId GROUP ALL`,
        { userId }
      ),
      ctx.db.query<[{ count: number }[]]>(
        `SELECT count() as count FROM repositoryCommit WHERE repositoryId.userId = $userId GROUP ALL`,
        { userId }
      ),
      ctx.db.query<[{ count: number }[]]>(
        `SELECT count() as count FROM pullRequest WHERE userId = $userId GROUP ALL`,
        { userId }
      ),
      ctx.db.query<[ActivityLog[]]>(
        `SELECT * FROM activityLog WHERE userId = $userId ORDER BY occurredAt DESC LIMIT 10`,
        { userId }
      ),
    ]);

    const totalTasks = tasksResults[0]?.length ?? 0;
    const completedTasks = completedTasksResults[0]?.length ?? 0;
    const totalRepos = repoResults[0]?.[0]?.count ?? 0;
    const totalCommits = commitResults[0]?.[0]?.count ?? 0;
    const totalPRs = prResults[0]?.[0]?.count ?? 0;
    const recentActivity = recentActivityResults[0] ?? [];

    return {
      totalTasks,
      completedTasks,
      totalRepos,
      totalCommits,
      totalPRs,
      recentActivity,
    };
  }),

  /**
   * Get dashboard statistics
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalTasksResults,
      completedTodayResults,
      activitiesResults,
      openPRsResults,
    ] = await Promise.all([
      ctx.db.query<[Task[]]>(`SELECT * FROM task WHERE userId = $userId`, {
        userId,
      }),
      ctx.db.query<[Task[]]>(
        `SELECT * FROM task WHERE userId = $userId AND status = "DONE" AND completedAt >= $today`,
        { userId, today }
      ),
      ctx.db.query<[ActivityLog[]]>(
        `SELECT * FROM activityLog WHERE userId = $userId AND occurredAt >= $today`,
        { userId, today }
      ),
      ctx.db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM pullRequest WHERE userId = $userId AND state = "OPEN" GROUP ALL`,
        { userId }
      ),
    ]);

    const totalTasks = totalTasksResults[0]?.length ?? 0;
    const completedToday = completedTodayResults[0]?.length ?? 0;
    const activitiesToday = activitiesResults[0]?.length ?? 0;
    const openPRs = openPRsResults[0]?.[0]?.count ?? 0;

    return {
      totalTasks,
      completedToday,
      activitiesToday,
      openPRs,
    };
  }),
});
