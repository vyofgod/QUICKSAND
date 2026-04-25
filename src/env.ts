import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   */
  server: {
    SURREALDB_URL: z.string().min(1),
    SURREALDB_NAMESPACE: z.string().min(1),
    SURREALDB_DATABASE: z.string().min(1),
    SURREALDB_USER: z.string().min(1),
    SURREALDB_PASSWORD: z.string().min(1),
    AUTH_SECRET: z.string().min(32),
    AUTH_TRUST_HOST: z.string().optional(),
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    AUTH_GITLAB_ID: z.string().optional(),
    AUTH_GITLAB_SECRET: z.string().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default("openai/gpt-4-turbo-preview"),
    AI_MAX_TOKENS: z.string().default("2000"),
    AI_TEMPERATURE: z.string().default("0.7"),
    GITHUB_PERSONAL_ACCESS_TOKEN: z.string().optional(),
    GITLAB_PERSONAL_ACCESS_TOKEN: z.string().optional(),
    GITLAB_API_URL: z.string().url().default("https://gitlab.com/api/v4"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Client-side environment variables schema
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_ENABLE_OFFLINE_MODE: z
      .string()
      .default("true")
      .transform((val) => val === "true"),
    NEXT_PUBLIC_ENABLE_AI_INSIGHTS: z
      .string()
      .default("true")
      .transform((val) => val === "true"),
    NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  },

  /**
   * Runtime environment variables
   */
  runtimeEnv: {
    SURREALDB_URL: process.env.SURREALDB_URL,
    SURREALDB_NAMESPACE: process.env.SURREALDB_NAMESPACE,
    SURREALDB_DATABASE: process.env.SURREALDB_DATABASE,
    SURREALDB_USER: process.env.SURREALDB_USER,
    SURREALDB_PASSWORD: process.env.SURREALDB_PASSWORD,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_GITLAB_ID: process.env.AUTH_GITLAB_ID,
    AUTH_GITLAB_SECRET: process.env.AUTH_GITLAB_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
    AI_TEMPERATURE: process.env.AI_TEMPERATURE,
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    GITLAB_PERSONAL_ACCESS_TOKEN: process.env.GITLAB_PERSONAL_ACCESS_TOKEN,
    GITLAB_API_URL: process.env.GITLAB_API_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENABLE_OFFLINE_MODE: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE,
    NEXT_PUBLIC_ENABLE_AI_INSIGHTS: process.env.NEXT_PUBLIC_ENABLE_AI_INSIGHTS,
    NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  },

  /**
   * Skip validation in build mode
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
