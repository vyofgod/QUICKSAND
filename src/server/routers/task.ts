/**
 * Task management router - SurrealDB version
 */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TaskStatus, TaskPriority, SyncStatus, type Task } from "@/lib/db-schema";
import { helpers } from "@/lib/db";

const taskInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  labels: z.array(z.string()).default([]),
  position: z.number().default(0),
  dueDate: z.date().optional(),
});

export const taskRouter = createTRPCRouter({
  /**
   * Get all tasks for the current user
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(TaskStatus).optional(),
          priority: z.nativeEnum(TaskPriority).optional(),
          labels: z.array(z.string()).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);

      let query = `SELECT * FROM task WHERE userId = $userId`;
      const params: Record<string, any> = { userId };

      if (input?.status) {
        query += ` AND status = $status`;
        params.status = input.status;
      }
      if (input?.priority) {
        query += ` AND priority = $priority`;
        params.priority = input.priority;
      }
      if (input?.labels && input.labels.length > 0) {
        query += ` AND labels CONTAINSANY $labels`;
        params.labels = input.labels;
      }

      query += ` ORDER BY status ASC, position ASC, createdAt DESC`;

      const results = await ctx.db.query<[Task[]]>(query, params);
      return results[0] ?? [];
    }),

  /**
   * Get a single task by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const taskId = helpers.recordId("task", input.id);

      const results = await ctx.db.query<[Task[]]>(
        `SELECT * FROM $taskId WHERE userId = $userId LIMIT 1`,
        { taskId, userId }
      );

      const task = results[0]?.[0];
      if (!task) {
        throw new Error("Task not found");
      }

      return task;
    }),

  /**
   * Create a new task
   */
  create: protectedProcedure
    .input(taskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);

      const [task] = await ctx.db.create<Task>("task", {
        ...input,
        userId,
        syncStatus: SyncStatus.SYNCED,
        lastSyncedAt: new Date(),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return task;
    }),

  /**
   * Update an existing task
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: taskInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const taskId = helpers.recordId("task", input.id);

      // Check ownership
      const checkResults = await ctx.db.query<[Task[]]>(
        `SELECT * FROM $taskId WHERE userId = $userId LIMIT 1`,
        { taskId, userId }
      );

      if (!checkResults[0]?.[0]) {
        throw new Error("Task not found");
      }

      const currentVersion = checkResults[0][0].version;

      const [updated] = await ctx.db.merge<Task>(taskId, {
        ...input.data,
        version: currentVersion + 1,
        syncStatus: SyncStatus.SYNCED,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      });

      return updated;
    }),

  /**
   * Update task positions (for drag-and-drop)
   */
  updatePositions: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            status: z.nativeEnum(TaskStatus),
            position: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);

      // Update each task
      for (const update of input.updates) {
        const taskId = helpers.recordId("task", update.id);

        const checkResults = await ctx.db.query<[Task[]]>(
          `SELECT version FROM $taskId WHERE userId = $userId LIMIT 1`,
          { taskId, userId }
        );

        if (checkResults[0]?.[0]) {
          const currentVersion = checkResults[0][0].version;

          await ctx.db.merge<Task>(taskId, {
            status: update.status,
            position: update.position,
            version: currentVersion + 1,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return { success: true };
    }),

  /**
   * Delete a task
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const taskId = helpers.recordId("task", input.id);

      await ctx.db.query(
        `DELETE $taskId WHERE userId = $userId`,
        { taskId, userId }
      );

      return { success: true };
    }),

  /**
   * Sync pending tasks (for offline mode)
   */
  syncPending: protectedProcedure
    .input(
      z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            version: z.number(),
            data: taskInputSchema.partial(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const results = [];

      for (const task of input.tasks) {
        try {
          const taskId = helpers.recordId("task", task.id);

          const existingResults = await ctx.db.query<[Task[]]>(
            `SELECT * FROM $taskId WHERE userId = $userId LIMIT 1`,
            { taskId, userId }
          );

          const existing = existingResults[0]?.[0];

          // Conflict detection
          if (existing && existing.version > task.version) {
            results.push({
              id: task.id,
              status: "conflict" as const,
              serverVersion: existing,
            });
            continue;
          }

          // Update or create
          if (existing) {
            const [updated] = await ctx.db.merge<Task>(taskId, {
              ...task.data,
              version: existing.version + 1,
              syncStatus: SyncStatus.SYNCED,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            });
            results.push({ id: task.id, status: "synced" as const, data: updated });
          } else {
            const [created] = await ctx.db.create<Task>(taskId, {
              ...task.data,
              title: task.data.title ?? "Untitled",
              userId,
              status: task.data.status ?? TaskStatus.TODO,
              priority: task.data.priority ?? TaskPriority.MEDIUM,
              labels: task.data.labels ?? [],
              position: task.data.position ?? 0,
              syncStatus: SyncStatus.SYNCED,
              lastSyncedAt: new Date(),
              version: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            results.push({ id: task.id, status: "synced" as const, data: created });
          }
        } catch (error) {
          results.push({
            id: task.id,
            status: "error" as const,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),
});
