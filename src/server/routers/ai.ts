/**
 * AI insights router with streaming support - SurrealDB version
 */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { AIPromptType, type AIPromptHistory, type Task, type ActivityLog } from "@/lib/db-schema";
import { env } from "@/env";
import { helpers } from "@/lib/db";

export const aiRouter = createTRPCRouter({
  /**
   * Get AI prompt history
   */
  getHistory: protectedProcedure
    .input(
      z
        .object({
          type: z.nativeEnum(AIPromptType).optional(),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);

      let query = `SELECT * FROM aiPromptHistory WHERE userId = $userId`;
      const params: Record<string, any> = { userId };

      if (input?.type) {
        query += ` AND type = $type`;
        params.type = input.type;
      }

      query += ` ORDER BY createdAt DESC LIMIT $limit`;
      params.limit = input?.limit ?? 20;

      const results = await ctx.db.query<[AIPromptHistory[]]>(query, params);
      return results[0] ?? [];
    }),

  /**
   * Generate AI insights
   */
  generateInsight: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(2000),
        type: z.nativeEnum(AIPromptType).default(AIPromptType.INSIGHT),
        context: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!env.OPENROUTER_API_KEY) {
        throw new Error("AI service not configured");
      }

      try {
        const userId = helpers.recordId("user", ctx.session.user.id);

        // Get user preferences for AI settings
        const preferencesResults = await ctx.db.query<[any[]]>(
          `SELECT * FROM userPreferences WHERE userId = $userId LIMIT 1`,
          { userId }
        );

        const preferences = preferencesResults[0]?.[0];

        const model = preferences?.aiModel ?? env.AI_MODEL;
        const maxTokens =
          preferences?.aiMaxTokens ?? parseInt(env.AI_MAX_TOKENS);
        const temperature =
          preferences?.aiTemperature ?? parseFloat(env.AI_TEMPERATURE);
        const systemPrompt =
          preferences?.aiSystemPrompt ??
          "You are a helpful AI assistant for a developer productivity dashboard. Provide concise, actionable insights based on the user's activity data.";

        // Call OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
            "X-Title": "DevFocus Dashboard",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.prompt },
            ],
            max_tokens: maxTokens,
            temperature,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content ?? "No response generated";
        const tokensUsed = data.usage?.total_tokens ?? 0;

        // Save to history
        const [historyEntry] = await ctx.db.create<AIPromptHistory>("aiPromptHistory", {
          userId,
          prompt: input.prompt,
          response: aiResponse,
          model,
          tokens: tokensUsed,
          type: input.type,
          metadata: input.context ?? {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return {
          response: aiResponse,
          tokens: tokensUsed,
          id: helpers.extractId(historyEntry.id as string),
        };
      } catch (error) {
        console.error("AI generation error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to generate AI insight"
        );
      }
    }),

  /**
   * Generate daily summary
   */
  generateDailySummary: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);

    // Gather today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [tasksResults, activitiesResults] = await Promise.all([
      ctx.db.query<[Task[]]>(
        `SELECT * FROM task WHERE userId = $userId AND updatedAt >= $today`,
        { userId, today }
      ),
      ctx.db.query<[ActivityLog[]]>(
        `SELECT * FROM activityLog WHERE userId = $userId AND occurredAt >= $today ORDER BY occurredAt DESC LIMIT 20`,
        { userId, today }
      ),
    ]);

    const tasks = tasksResults[0] ?? [];
    const activities = activitiesResults[0] ?? [];

    const completedTasks = tasks.filter((t) => t.status === "DONE");

    const prompt = `Generate a concise daily summary based on this productivity data:

Completed Tasks: ${completedTasks.length}
Total Tasks: ${tasks.length}
Recent Activities: ${activities.length}

Activity Breakdown:
${activities
  .slice(0, 10)
  .map((a) => `- ${a.type}: ${a.title}`)
  .join("\n")}

Provide:
1. A brief summary of accomplishments
2. Commit and PR activity analysis
3. 2-3 actionable recommendations for tomorrow`;

    const [summary] = await ctx.db.create<AIPromptHistory>("aiPromptHistory", {
      userId,
      prompt,
      response: "Summary generation in progress...",
      model: env.AI_MODEL,
      type: AIPromptType.SUMMARY,
      metadata: {
        tasksCompleted: completedTasks.length,
        focusMinutes: totalFocusMinutes,
        activitiesCount: activities.length,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return summary;
  }),

  /**
   * Delete AI prompt history entry
   */
  deleteHistory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const historyId = helpers.recordId("aiPromptHistory", input.id);

      await ctx.db.query(
        `DELETE $historyId WHERE userId = $userId`,
        { historyId, userId }
      );

      return { success: true };
    }),
});
