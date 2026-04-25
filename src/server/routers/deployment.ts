import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { helpers } from "@/lib/db";
import {
  DeploymentStatus,
  type Deployment,
  type DeploymentConfig,
} from "@/lib/db-schema";

export const deploymentRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        repoId: z.string().optional(),
        status: z.nativeEnum(DeploymentStatus).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);

      let query = `SELECT * FROM deployment WHERE userId = $userId`;
      const params: Record<string, unknown> = { userId: userRecordId };

      if (input.repoId) {
        query += ` AND repositoryId = $repoId`;
        params.repoId = helpers.recordId(
          "repository",
          helpers.extractId(input.repoId)
        );
      }

      if (input.status) {
        query += ` AND status = $status`;
        params.status = input.status;
      }

      query += ` ORDER BY createdAt DESC LIMIT $limit START $offset`;
      params.limit = input.limit;
      params.offset = input.offset;

      const results = await db.query<[Deployment[]]>(query, params);
      return results[0] ?? [];
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);
      const rawId = helpers.extractId(input.id);

      const results = await db.query<[Deployment[]]>(
        `SELECT * FROM type::thing("deployment", $id) WHERE userId = $userId LIMIT 1`,
        { id: rawId, userId: userRecordId }
      );
      const dep = results[0]?.[0];
      if (!dep) throw new Error("Deployment not found");
      return dep;
    }),

  recent: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const results = await db.query<[Deployment[]]>(
      `SELECT * FROM deployment WHERE userId = $userId ORDER BY createdAt DESC LIMIT 5`,
      { userId: userRecordId }
    );
    return results[0] ?? [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        branch: z.string(),
        environment: z
          .enum(["production", "preview", "staging"])
          .default("production"),
        triggeredBy: z.enum(["push", "manual", "pr"]).default("manual"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);
      const repoRecordId = helpers.recordId(
        "repository",
        helpers.extractId(input.repositoryId)
      );

      const configResults = await db.query<[DeploymentConfig[]]>(
        `SELECT * FROM deploymentConfig WHERE repositoryId = $repoId AND userId = $userId LIMIT 1`,
        { repoId: repoRecordId, userId: userRecordId }
      );
      const _config = configResults[0]?.[0];

      const result = await db.query<[Deployment[]]>(
        `CREATE deployment SET
          repositoryId = $repoId,
          userId = $userId,
          branch = $branch,
          status = $status,
          logs = "",
          triggeredBy = $triggeredBy,
          environment = $environment,
          startedAt = time::now(),
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          repoId: repoRecordId,
          userId: userRecordId,
          branch: input.branch,
          status: DeploymentStatus.PENDING,
          triggeredBy: input.triggeredBy,
          environment: input.environment,
        }
      );

      const deployment = result[0]?.[0];
      if (!deployment) throw new Error("Failed to create deployment");

      // Simulate build process (in production, this would trigger an actual build)
      const deployId = helpers.extractId(String(deployment.id));
      await db.query(
        `UPDATE type::thing("deployment", $id) SET status = $status, updatedAt = time::now()`,
        { id: deployId, status: DeploymentStatus.BUILDING }
      );

      return deployment;
    }),

  rollback: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);
      const rawId = helpers.extractId(input.deploymentId);

      const results = await db.query<[Deployment[]]>(
        `SELECT * FROM type::thing("deployment", $id) WHERE userId = $userId LIMIT 1`,
        { id: rawId, userId: userRecordId }
      );
      const dep = results[0]?.[0];
      if (!dep) throw new Error("Deployment not found");

      // Create a new deployment as rollback
      const result = await db.query<[Deployment[]]>(
        `CREATE deployment SET
          repositoryId = $repoId,
          userId = $userId,
          branch = $branch,
          commit = $commit,
          status = $status,
          logs = "Rollback from deployment " + $sourceId,
          triggeredBy = "manual",
          environment = $environment,
          startedAt = time::now(),
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          repoId: dep.repositoryId,
          userId: userRecordId,
          branch: dep.branch,
          commit: dep.commit ?? null,
          status: DeploymentStatus.PENDING,
          environment: dep.environment,
          sourceId: rawId,
        }
      );

      return result[0]?.[0] ?? null;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        status: z.nativeEnum(DeploymentStatus),
        logs: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);
      const rawId = helpers.extractId(input.deploymentId);

      await db.query(
        `UPDATE type::thing("deployment", $id) SET
          status = $status,
          logs = $logs,
          url = $url,
          finishedAt = IF $status IN [$success, $failed, $cancelled] THEN time::now() ELSE NONE END,
          updatedAt = time::now()
        WHERE userId = $userId`,
        {
          id: rawId,
          userId: userRecordId,
          status: input.status,
          logs: input.logs ?? "",
          url: input.url ?? null,
          success: DeploymentStatus.SUCCESS,
          failed: DeploymentStatus.FAILED,
          cancelled: DeploymentStatus.CANCELLED,
        }
      );

      return { success: true };
    }),

  getConfig: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);
      const repoRecordId = helpers.recordId(
        "repository",
        helpers.extractId(input.repositoryId)
      );

      const results = await db.query<[DeploymentConfig[]]>(
        `SELECT * FROM deploymentConfig WHERE repositoryId = $repoId AND userId = $userId LIMIT 1`,
        { repoId: repoRecordId, userId: userRecordId }
      );
      return results[0]?.[0] ?? null;
    }),

  saveConfig: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        buildCommand: z.string().default("npm run build"),
        outputDir: z.string().default("dist"),
        envVars: z.record(z.string()).default({}),
        autoDeploy: z.boolean().default(false),
        autoDeployBranch: z.string().default("main"),
        customDomain: z.string().optional(),
        framework: z.string().optional(),
        nodeVersion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;
      const userRecordId = helpers.recordId("user", userId);
      const repoRecordId = helpers.recordId(
        "repository",
        helpers.extractId(input.repositoryId)
      );

      const existing = await db.query<[DeploymentConfig[]]>(
        `SELECT id FROM deploymentConfig WHERE repositoryId = $repoId AND userId = $userId LIMIT 1`,
        { repoId: repoRecordId, userId: userRecordId }
      );

      const data = {
        repositoryId: repoRecordId,
        userId: userRecordId,
        buildCommand: input.buildCommand,
        outputDir: input.outputDir,
        envVars: input.envVars,
        autoDeploy: input.autoDeploy,
        autoDeployBranch: input.autoDeployBranch,
        customDomain: input.customDomain ?? null,
        framework: input.framework ?? null,
        nodeVersion: input.nodeVersion ?? null,
        updatedAt: new Date(),
      };

      if (existing[0]?.[0]) {
        const existingId = helpers.extractId(String(existing[0][0].id));
        await db.query(
          `UPDATE type::thing("deploymentConfig", $id) SET
            buildCommand = $buildCommand,
            outputDir = $outputDir,
            envVars = $envVars,
            autoDeploy = $autoDeploy,
            autoDeployBranch = $autoDeployBranch,
            customDomain = $customDomain,
            framework = $framework,
            nodeVersion = $nodeVersion,
            updatedAt = time::now()`,
          { id: existingId, ...data }
        );
      } else {
        await db.query(
          `CREATE deploymentConfig SET
            repositoryId = $repositoryId,
            userId = $userId,
            buildCommand = $buildCommand,
            outputDir = $outputDir,
            envVars = $envVars,
            autoDeploy = $autoDeploy,
            autoDeployBranch = $autoDeployBranch,
            customDomain = $customDomain,
            framework = $framework,
            nodeVersion = $nodeVersion,
            createdAt = time::now(),
            updatedAt = time::now()`,
          data
        );
      }

      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx.session.user.id;
    const userRecordId = helpers.recordId("user", userId);

    const results = await db.query<[{ status: DeploymentStatus; count: number }[]]>(
      `SELECT status, count() AS count FROM deployment WHERE userId = $userId GROUP BY status`,
      { userId: userRecordId }
    );

    const byStatus = results[0] ?? [];
    return {
      total: byStatus.reduce((sum, r) => sum + r.count, 0),
      successful: byStatus.find((r) => r.status === DeploymentStatus.SUCCESS)?.count ?? 0,
      failed: byStatus.find((r) => r.status === DeploymentStatus.FAILED)?.count ?? 0,
      pending: byStatus.find((r) => r.status === DeploymentStatus.PENDING)?.count ?? 0,
    };
  }),
});
