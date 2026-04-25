/**
 * Main tRPC router
 */
import { createTRPCRouter } from "@/server/trpc";
import { taskRouter } from "./task";
import { aiRouter } from "./ai";
import { activityRouter } from "./activity";
import { userRouter } from "./user";
import { repositoryRouter } from "./repository";
import { prRouter } from "./pr";
import { streakRouter } from "./streak";
import { issueRouter } from "./issue";
import { reviewRouter } from "./review";
import { deploymentRouter } from "./deployment";
import { deployRouter } from "./deploy";

export const appRouter = createTRPCRouter({
  task: taskRouter,
  ai: aiRouter,
  activity: activityRouter,
  user: userRouter,
  repository: repositoryRouter,
  pr: prRouter,
  streak: streakRouter,
  issue: issueRouter,
  review: reviewRouter,
  deployment: deploymentRouter,
  deploy: deployRouter,
});

export type AppRouter = typeof appRouter;
