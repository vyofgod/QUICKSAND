/**
 * Deploy Platform tRPC Router
 * Handles all operations for the DevDeploy platform — projects, servers,
 * databases, domains, env vars, and notification channels.
 */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { helpers } from "@/lib/db";
import {
  type DeployProject,
  type DeployServer,
  type DeployDatabase,
  type DeployDomain,
  type DeployEnvVar,
  type DeployNotificationChannel,
  type Deployment,
  DeploymentStatus,
} from "@/lib/db-schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const projectIdSchema = z.object({ id: z.string().min(1) });

// ─── Project Router ───────────────────────────────────────────────────────────

const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const results = await ctx.db.query<[DeployProject[]]>(
      `SELECT * FROM deployProject WHERE userId = $userId ORDER BY createdAt DESC`,
      { userId }
    );
    return results[0] ?? [];
  }),

  get: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    const results = await ctx.db.query<[DeployProject[]]>(
      `SELECT * FROM type::thing("deployProject", $id) WHERE userId = $userId LIMIT 1`,
      { id: rawId, userId }
    );
    const project = results[0]?.[0];
    if (!project) throw new Error("Project not found");
    return project;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        framework: z.string().optional(),
        branch: z.string().default("main"),
        gitUrl: z.string().optional(),
        sourceType: z.enum(["github", "git", "docker", "template"]).default("github"),
        dockerImage: z.string().optional(),
        buildCommand: z.string().default("npm run build"),
        outputDir: z.string().default("dist"),
        installCommand: z.string().default("npm install"),
        rootDir: z.string().default("./"),
        port: z.number().int().min(1).max(65535).default(3000),
        region: z.string().default("eu-west"),
        instances: z.number().int().min(1).max(20).default(1),
        serverId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const slug = input.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      const autoUrl = `${slug}.devdeploy.app`;

      const results = await ctx.db.query<[DeployProject[]]>(
        `CREATE deployProject SET
          userId = $userId,
          name = $name,
          description = $description,
          status = "idle",
          framework = $framework,
          branch = $branch,
          gitUrl = $gitUrl,
          sourceType = $sourceType,
          dockerImage = $dockerImage,
          buildCommand = $buildCommand,
          outputDir = $outputDir,
          installCommand = $installCommand,
          rootDir = $rootDir,
          port = $port,
          region = $region,
          instances = $instances,
          url = $url,
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId,
          name: input.name,
          description: input.description ?? null,
          framework: input.framework ?? null,
          branch: input.branch,
          gitUrl: input.gitUrl ?? null,
          sourceType: input.sourceType,
          dockerImage: input.dockerImage ?? null,
          buildCommand: input.buildCommand,
          outputDir: input.outputDir,
          installCommand: input.installCommand,
          rootDir: input.rootDir,
          port: input.port,
          region: input.region,
          instances: input.instances,
          url: autoUrl,
        }
      );
      const project = results[0]?.[0];
      if (!project) throw new Error("Failed to create project");
      return project;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        framework: z.string().optional(),
        branch: z.string().optional(),
        gitUrl: z.string().optional(),
        buildCommand: z.string().optional(),
        outputDir: z.string().optional(),
        installCommand: z.string().optional(),
        rootDir: z.string().optional(),
        port: z.number().int().optional(),
        region: z.string().optional(),
        instances: z.number().int().min(1).max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.id);

      const existing = await ctx.db.query<[DeployProject[]]>(
        `SELECT id FROM type::thing("deployProject", $id) WHERE userId = $userId LIMIT 1`,
        { id: rawId, userId }
      );
      if (!existing[0]?.[0]) throw new Error("Project not found");

      const fields: string[] = ["updatedAt = time::now()"];
      const params: Record<string, unknown> = { id: rawId, userId };

      const updatable = ["name", "description", "framework", "branch", "gitUrl",
        "buildCommand", "outputDir", "installCommand", "rootDir", "port", "region", "instances"] as const;
      for (const key of updatable) {
        if (input[key] !== undefined) {
          fields.push(`${key} = $${key}`);
          params[key] = input[key];
        }
      }

      await ctx.db.query(
        `UPDATE type::thing("deployProject", $id) SET ${fields.join(", ")} WHERE userId = $userId`,
        params
      );
      return { success: true };
    }),

  delete: protectedProcedure.input(projectIdSchema).mutation(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    await ctx.db.query(
      `DELETE type::thing("deployProject", $id) WHERE userId = $userId`,
      { id: rawId, userId }
    );
    // Cascade: delete related domains and env vars
    const projectRecordId = helpers.recordId("deployProject", rawId);
    await ctx.db.query(
      `DELETE deployDomain WHERE projectId = $pid AND userId = $userId`,
      { pid: projectRecordId, userId }
    );
    await ctx.db.query(
      `DELETE deployEnvVar WHERE projectId = $pid AND userId = $userId`,
      { pid: projectRecordId, userId }
    );
    return { success: true };
  }),

  deploy: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        branch: z.string().optional(),
        environment: z.enum(["production", "preview", "staging"]).default("production"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.id);

      const existing = await ctx.db.query<[DeployProject[]]>(
        `SELECT * FROM type::thing("deployProject", $id) WHERE userId = $userId LIMIT 1`,
        { id: rawId, userId }
      );
      const project = existing[0]?.[0];
      if (!project) throw new Error("Project not found");

      // Set project status to building
      await ctx.db.query(
        `UPDATE type::thing("deployProject", $id) SET status = "building", lastDeployedAt = time::now(), updatedAt = time::now() WHERE userId = $userId`,
        { id: rawId, userId }
      );

      // Create a Deployment record for history
      const deployResult = await ctx.db.query<[Deployment[]]>(
        `CREATE deployment SET
          userId = $userId,
          repositoryId = $projectRecordId,
          branch = $branch,
          status = $status,
          logs = "",
          triggeredBy = "manual",
          environment = $environment,
          startedAt = time::now(),
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId,
          projectRecordId: helpers.recordId("deployProject", rawId),
          branch: input.branch ?? project.branch,
          status: DeploymentStatus.BUILDING,
          environment: input.environment,
        }
      );
      const deployment = deployResult[0]?.[0];
      if (!deployment) throw new Error("Failed to create deployment record");

      // Simulate build success after a short time (in production this would be a real build system)
      const deployId = helpers.extractId(String(deployment.id));
      const projectUrl = project.url ?? `${project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.devdeploy.app`;
      await ctx.db.query(
        `UPDATE type::thing("deployment", $id) SET
          status = $status,
          url = $url,
          finishedAt = time::now(),
          buildDuration = 83,
          logs = $logs,
          updatedAt = time::now()`,
        {
          id: deployId,
          status: DeploymentStatus.SUCCESS,
          url: `https://${projectUrl}`,
          logs: `[${new Date().toISOString()}] Build started\n[${new Date().toISOString()}] Installing dependencies...\n[${new Date().toISOString()}] Building...\n[${new Date().toISOString()}] ✓ Build successful`,
        }
      );

      // Set project status back to running
      await ctx.db.query(
        `UPDATE type::thing("deployProject", $id) SET status = "running", updatedAt = time::now() WHERE userId = $userId`,
        { id: rawId, userId }
      );

      return { success: true, deploymentId: String(deployment.id) };
    }),

  stop: protectedProcedure.input(projectIdSchema).mutation(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    await ctx.db.query(
      `UPDATE type::thing("deployProject", $id) SET status = "stopped", instances = 0, updatedAt = time::now() WHERE userId = $userId`,
      { id: rawId, userId }
    );
    return { success: true };
  }),

  restart: protectedProcedure.input(projectIdSchema).mutation(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);

    const existing = await ctx.db.query<[DeployProject[]]>(
      `SELECT instances FROM type::thing("deployProject", $id) WHERE userId = $userId LIMIT 1`,
      { id: rawId, userId }
    );
    const prev = existing[0]?.[0];
    await ctx.db.query(
      `UPDATE type::thing("deployProject", $id) SET status = "running", instances = $inst, updatedAt = time::now() WHERE userId = $userId`,
      { id: rawId, userId, inst: prev?.instances && prev.instances > 0 ? prev.instances : 1 }
    );
    return { success: true };
  }),

  getDeployments: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    const projectRecordId = helpers.recordId("deployProject", rawId);

    const results = await ctx.db.query<[Deployment[]]>(
      `SELECT * FROM deployment WHERE userId = $userId AND repositoryId = $projectId ORDER BY createdAt DESC LIMIT 20`,
      { userId, projectId: projectRecordId }
    );
    return results[0] ?? [];
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const [projectsRes, deploymentsRes] = await Promise.all([
      ctx.db.query<[{ status: string; count: number }[]]>(
        `SELECT status, count() AS count FROM deployProject WHERE userId = $userId GROUP BY status`,
        { userId }
      ),
      ctx.db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM deployment WHERE userId = $userId AND createdAt > time::now() - 1d`,
        { userId }
      ),
    ]);

    const byStatus = projectsRes[0] ?? [];
    const total = byStatus.reduce((s, r) => s + r.count, 0);
    const running = byStatus.find((r) => r.status === "running")?.count ?? 0;
    const deploymentsToday = deploymentsRes[0]?.[0]?.count ?? 0;

    return { total, running, deploymentsToday };
  }),
});

// ─── Domain Router ────────────────────────────────────────────────────────────

const domainRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.projectId);
      const projectRecordId = helpers.recordId("deployProject", rawId);
      const results = await ctx.db.query<[DeployDomain[]]>(
        `SELECT * FROM deployDomain WHERE projectId = $pid AND userId = $userId ORDER BY primary DESC, createdAt ASC`,
        { pid: projectRecordId, userId }
      );
      return results[0] ?? [];
    }),

  add: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        domain: z.string().min(3),
        domainType: z.enum(["auto", "custom"]).default("custom"),
        primary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.projectId);
      const projectRecordId = helpers.recordId("deployProject", rawId);

      const results = await ctx.db.query<[DeployDomain[]]>(
        `CREATE deployDomain SET
          userId = $userId,
          projectId = $pid,
          domain = $domain,
          domainType = $domainType,
          ssl = false,
          primary = $primary,
          status = "pending",
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId,
          pid: projectRecordId,
          domain: input.domain,
          domainType: input.domainType,
          primary: input.primary,
        }
      );
      return results[0]?.[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.id);
      await ctx.db.query(
        `DELETE type::thing("deployDomain", $id) WHERE userId = $userId`,
        { id: rawId, userId }
      );
      return { success: true };
    }),
});

// ─── EnvVar Router ────────────────────────────────────────────────────────────

const envVarRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.projectId);
      const projectRecordId = helpers.recordId("deployProject", rawId);
      const results = await ctx.db.query<[DeployEnvVar[]]>(
        `SELECT * FROM deployEnvVar WHERE projectId = $pid AND userId = $userId ORDER BY key ASC`,
        { pid: projectRecordId, userId }
      );
      return results[0] ?? [];
    }),

  set: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        key: z.string().min(1).regex(/^[A-Z0-9_]+$/i, "Key must be alphanumeric with underscores"),
        value: z.string(),
        secret: z.boolean().default(false),
        scope: z.enum(["all", "production", "preview", "development"]).default("all"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.projectId);
      const projectRecordId = helpers.recordId("deployProject", rawId);

      // Upsert: delete existing with same key+project, then create
      await ctx.db.query(
        `DELETE deployEnvVar WHERE projectId = $pid AND userId = $userId AND key = $key`,
        { pid: projectRecordId, userId, key: input.key }
      );
      const results = await ctx.db.query<[DeployEnvVar[]]>(
        `CREATE deployEnvVar SET
          userId = $userId,
          projectId = $pid,
          key = $key,
          value = $value,
          secret = $secret,
          scope = $scope,
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId,
          pid: projectRecordId,
          key: input.key,
          value: input.value,
          secret: input.secret,
          scope: input.scope,
        }
      );
      return results[0]?.[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.id);
      await ctx.db.query(
        `DELETE type::thing("deployEnvVar", $id) WHERE userId = $userId`,
        { id: rawId, userId }
      );
      return { success: true };
    }),

  bulkImport: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        envText: z.string(),
        scope: z.enum(["all", "production", "preview", "development"]).default("all"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.projectId);
      const projectRecordId = helpers.recordId("deployProject", rawId);

      const lines = input.envText.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
      let imported = 0;

      for (const line of lines) {
        const eqIdx = line.indexOf("=");
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!key) continue;

        await ctx.db.query(
          `DELETE deployEnvVar WHERE projectId = $pid AND userId = $userId AND key = $key`,
          { pid: projectRecordId, userId, key }
        );
        await ctx.db.query(
          `CREATE deployEnvVar SET
            userId = $userId, projectId = $pid, key = $key, value = $value,
            secret = false, scope = $scope,
            createdAt = time::now(), updatedAt = time::now()`,
          { userId, pid: projectRecordId, key, value, scope: input.scope }
        );
        imported++;
      }
      return { imported };
    }),
});

// ─── Server Router ────────────────────────────────────────────────────────────

const serverRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const results = await ctx.db.query<[DeployServer[]]>(
      `SELECT * FROM deployServer WHERE userId = $userId ORDER BY createdAt DESC`,
      { userId }
    );
    return results[0] ?? [];
  }),

  get: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    const results = await ctx.db.query<[DeployServer[]]>(
      `SELECT * FROM type::thing("deployServer", $id) WHERE userId = $userId LIMIT 1`,
      { id: rawId, userId }
    );
    const server = results[0]?.[0];
    if (!server) throw new Error("Server not found");
    return server;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        provider: z.string().min(1),
        location: z.string().min(1),
        ip: z.string().min(7),
        os: z.string().optional(),
        sshUser: z.string().optional(),
        sshPort: z.number().int().optional(),
        cpuCores: z.number().int().optional(),
        memoryMb: z.number().int().optional(),
        diskGb: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const results = await ctx.db.query<[DeployServer[]]>(
        `CREATE deployServer SET
          userId = $userId,
          name = $name,
          provider = $provider,
          location = $location,
          ip = $ip,
          os = $os,
          sshUser = $sshUser,
          sshPort = $sshPort,
          cpuCores = $cpuCores,
          memoryMb = $memoryMb,
          diskGb = $diskGb,
          status = "online",
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId,
          name: input.name,
          provider: input.provider,
          location: input.location,
          ip: input.ip,
          os: input.os ?? null,
          sshUser: input.sshUser ?? null,
          sshPort: input.sshPort ?? 22,
          cpuCores: input.cpuCores ?? null,
          memoryMb: input.memoryMb ?? null,
          diskGb: input.diskGb ?? null,
        }
      );
      const server = results[0]?.[0];
      if (!server) throw new Error("Failed to create server");
      return server;
    }),

  delete: protectedProcedure.input(projectIdSchema).mutation(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    await ctx.db.query(
      `DELETE type::thing("deployServer", $id) WHERE userId = $userId`,
      { id: rawId, userId }
    );
    return { success: true };
  }),

  projectCount: protectedProcedure
    .input(z.object({ serverId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const serverRecordId = helpers.recordId("deployServer", helpers.extractId(input.serverId));
      const results = await ctx.db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM deployProject WHERE userId = $userId AND serverId = $sid`,
        { userId, sid: serverRecordId }
      );
      return results[0]?.[0]?.count ?? 0;
    }),
});

// ─── Database Router ──────────────────────────────────────────────────────────

const databaseRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const results = await ctx.db.query<[DeployDatabase[]]>(
      `SELECT * FROM deployDatabase WHERE userId = $userId ORDER BY createdAt DESC`,
      { userId }
    );
    return results[0] ?? [];
  }),

  get: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    const results = await ctx.db.query<[DeployDatabase[]]>(
      `SELECT * FROM type::thing("deployDatabase", $id) WHERE userId = $userId LIMIT 1`,
      { id: rawId, userId }
    );
    const db = results[0]?.[0];
    if (!db) throw new Error("Database not found");
    return db;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        dbType: z.enum(["PostgreSQL", "MySQL", "Redis", "MongoDB", "MariaDB", "ClickHouse"]),
        version: z.string().optional(),
        port: z.number().int().optional(),
        dbUser: z.string().default("admin"),
        dbPassword: z.string().min(8),
        serverId: z.string().optional(),
        host: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const defaultPorts: Record<string, number> = {
        PostgreSQL: 5432, MySQL: 3306, Redis: 6379,
        MongoDB: 27017, MariaDB: 3306, ClickHouse: 9000,
      };
      const port = input.port ?? defaultPorts[input.dbType] ?? 5432;
      const serverId = input.serverId
        ? helpers.recordId("deployServer", helpers.extractId(input.serverId))
        : null;

      const results = await ctx.db.query<[DeployDatabase[]]>(
        `CREATE deployDatabase SET
          userId = $userId,
          name = $name,
          dbType = $dbType,
          version = $version,
          port = $port,
          dbUser = $dbUser,
          dbPassword = $dbPassword,
          host = $host,
          serverId = $serverId,
          status = "running",
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId,
          name: input.name,
          dbType: input.dbType,
          version: input.version ?? null,
          port,
          dbUser: input.dbUser,
          dbPassword: input.dbPassword,
          host: input.host ?? null,
          serverId,
        }
      );
      const database = results[0]?.[0];
      if (!database) throw new Error("Failed to create database");
      return database;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string().min(1), status: z.enum(["running", "stopped", "error"]) }))
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.id);
      await ctx.db.query(
        `UPDATE type::thing("deployDatabase", $id) SET status = $status, updatedAt = time::now() WHERE userId = $userId`,
        { id: rawId, status: input.status, userId }
      );
      return { success: true };
    }),

  delete: protectedProcedure.input(projectIdSchema).mutation(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    await ctx.db.query(
      `DELETE type::thing("deployDatabase", $id) WHERE userId = $userId`,
      { id: rawId, userId }
    );
    return { success: true };
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const results = await ctx.db.query<[{ status: string; count: number }[]]>(
      `SELECT status, count() AS count FROM deployDatabase WHERE userId = $userId GROUP BY status`,
      { userId }
    );
    const byStatus = results[0] ?? [];
    return {
      total: byStatus.reduce((s, r) => s + r.count, 0),
      running: byStatus.find((r) => r.status === "running")?.count ?? 0,
    };
  }),
});

// ─── Notification Router ──────────────────────────────────────────────────────

const notificationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const results = await ctx.db.query<[DeployNotificationChannel[]]>(
      `SELECT * FROM deployNotificationChannel WHERE userId = $userId ORDER BY createdAt DESC`,
      { userId }
    );
    return results[0] ?? [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        channelType: z.enum(["Slack", "Discord", "Telegram", "Email", "Webhook", "Ntfy", "Pushover", "Gotify"]),
        webhookUrl: z.string().optional(),
        token: z.string().optional(),
        chatId: z.string().optional(),
        email: z.string().email().optional(),
        events: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const results = await ctx.db.query<[DeployNotificationChannel[]]>(
        `CREATE deployNotificationChannel SET
          userId = $userId,
          name = $name,
          channelType = $channelType,
          webhookUrl = $webhookUrl,
          token = $token,
          chatId = $chatId,
          email = $email,
          events = $events,
          status = "active",
          createdAt = time::now(),
          updatedAt = time::now()`,
        {
          userId,
          name: input.name,
          channelType: input.channelType,
          webhookUrl: input.webhookUrl ?? null,
          token: input.token ?? null,
          chatId: input.chatId ?? null,
          email: input.email ?? null,
          events: input.events,
        }
      );
      const channel = results[0]?.[0];
      if (!channel) throw new Error("Failed to create notification channel");
      return channel;
    }),

  delete: protectedProcedure.input(projectIdSchema).mutation(async ({ ctx, input }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const rawId = helpers.extractId(input.id);
    await ctx.db.query(
      `DELETE type::thing("deployNotificationChannel", $id) WHERE userId = $userId`,
      { id: rawId, userId }
    );
    return { success: true };
  }),

  toggleStatus: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const rawId = helpers.extractId(input.id);
      const existing = await ctx.db.query<[DeployNotificationChannel[]]>(
        `SELECT status FROM type::thing("deployNotificationChannel", $id) WHERE userId = $userId LIMIT 1`,
        { id: rawId, userId }
      );
      const current = existing[0]?.[0]?.status ?? "active";
      const next = current === "active" ? "inactive" : "active";
      await ctx.db.query(
        `UPDATE type::thing("deployNotificationChannel", $id) SET status = $status, updatedAt = time::now() WHERE userId = $userId`,
        { id: rawId, status: next, userId }
      );
      return { status: next };
    }),
});

// ─── Monitoring Router ────────────────────────────────────────────────────────

const monitoringRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);

    const [projectsRes, deploymentsRes, failedRes] = await Promise.all([
      ctx.db.query<[{ status: string; count: number }[]]>(
        `SELECT status, count() AS count FROM deployProject WHERE userId = $userId GROUP BY status`,
        { userId }
      ),
      ctx.db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM deployment WHERE userId = $userId AND createdAt > time::now() - 24h`,
        { userId }
      ),
      ctx.db.query<[{ count: number }[]]>(
        `SELECT count() AS count FROM deployment WHERE userId = $userId AND status = "FAILED" AND createdAt > time::now() - 24h`,
        { userId }
      ),
    ]);

    const byStatus = projectsRes[0] ?? [];
    const totalProjects = byStatus.reduce((s, r) => s + r.count, 0);
    const runningProjects = byStatus.find((r) => r.status === "running")?.count ?? 0;
    const errorProjects = byStatus.find((r) => r.status === "error")?.count ?? 0;

    return {
      totalProjects,
      runningProjects,
      errorProjects,
      deploymentsToday: deploymentsRes[0]?.[0]?.count ?? 0,
      failedToday: failedRes[0]?.[0]?.count ?? 0,
    };
  }),

  recentDeployments: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const userId = helpers.recordId("user", ctx.session.user.id);
      const results = await ctx.db.query<[Deployment[]]>(
        `SELECT * FROM deployment WHERE userId = $userId ORDER BY createdAt DESC LIMIT $limit`,
        { userId, limit: input.limit }
      );
      return results[0] ?? [];
    }),

  projectStatuses: protectedProcedure.query(async ({ ctx }) => {
    const userId = helpers.recordId("user", ctx.session.user.id);
    const results = await ctx.db.query<[DeployProject[]]>(
      `SELECT id, name, status, url, lastDeployedAt FROM deployProject WHERE userId = $userId ORDER BY createdAt DESC`,
      { userId }
    );
    return results[0] ?? [];
  }),
});

// ─── Root Deploy Router ───────────────────────────────────────────────────────

export const deployRouter = createTRPCRouter({
  project: projectRouter,
  domain: domainRouter,
  envVar: envVarRouter,
  server: serverRouter,
  database: databaseRouter,
  notification: notificationRouter,
  monitoring: monitoringRouter,
});
