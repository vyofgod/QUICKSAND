/**
 * SurrealDB Schema Definitions
 * This file contains TypeScript types that match our SurrealDB schema
 */

import type { RecordId } from "./db";

// Enums
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum SyncStatus {
  SYNCED = "SYNCED",
  PENDING = "PENDING",
  CONFLICT = "CONFLICT",
  ERROR = "ERROR",
}

export enum PRState {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  MERGED = "MERGED",
  DRAFT = "DRAFT",
}

export enum ReviewAction {
  APPROVED = "APPROVED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  COMMENTED = "COMMENTED",
  DISMISSED = "DISMISSED",
}

export enum DeploymentStatus {
  PENDING = "PENDING",
  BUILDING = "BUILDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum AchievementType {
  COMMITS_10 = "COMMITS_10",
  COMMITS_100 = "COMMITS_100",
  COMMITS_1000 = "COMMITS_1000",
  PRS_10 = "PRS_10",
  PRS_50 = "PRS_50",
  REVIEWS_10 = "REVIEWS_10",
  REVIEWS_50 = "REVIEWS_50",
  STREAK_7 = "STREAK_7",
  STREAK_30 = "STREAK_30",
  STREAK_100 = "STREAK_100",
  DEPLOYMENTS_10 = "DEPLOYMENTS_10",
}

export enum ActivitySource {
  GITHUB = "GITHUB",
  GITLAB = "GITLAB",
  LOCAL = "LOCAL",
}

export enum ActivityType {
  COMMIT = "COMMIT",
  PULL_REQUEST = "PULL_REQUEST",
  MERGE_REQUEST = "MERGE_REQUEST",
  ISSUE = "ISSUE",
  REVIEW = "REVIEW",
  COMMENT = "COMMENT",
  TASK_COMPLETED = "TASK_COMPLETED",
  FOCUS_SESSION = "FOCUS_SESSION",
}

export enum AIPromptType {
  INSIGHT = "INSIGHT",
  SUMMARY = "SUMMARY",
  RECOMMENDATION = "RECOMMENDATION",
  CUSTOM = "CUSTOM",
}

// Base types
export interface BaseRecord {
  id: RecordId;
  createdAt: Date;
  updatedAt: Date;
}

// User and Auth
export interface User extends BaseRecord {
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
}

export interface Account extends BaseRecord {
  userId: RecordId<"user">;
  type: string;
  provider: string;
  providerAccountId: string;
  providerUsername?: string; // GitHub login or GitLab username
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface Session extends BaseRecord {
  sessionToken: string;
  userId: RecordId<"user">;
  expires: Date;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

// User Preferences
export interface UserPreferences extends BaseRecord {
  userId: RecordId<"user">;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  aiModel: string;
  aiMaxTokens: number;
  aiTemperature: number;
  aiSystemPrompt?: string;
  enableNotifications: boolean;
  enableSoundAlerts: boolean;
}

// Task
export interface Task extends BaseRecord {
  userId: RecordId<"user">;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  position: number;
  dueDate?: Date;
  completedAt?: Date;
  syncStatus: SyncStatus;
  lastSyncedAt?: Date;
  version: number;
}

// Pull Request
export interface PullRequest extends BaseRecord {
  repositoryId: RecordId<"repository">;
  userId: RecordId<"user">;
  externalId: string;
  number: number;
  title: string;
  description?: string;
  state: PRState;
  isDraft: boolean;
  author: string;
  authorAvatar?: string;
  reviewers: string[];
  requestedReviewers: string[];
  labels: string[];
  sourceBranch: string;
  targetBranch: string;
  url: string;
  ciStatus?: string;
  hasConflicts: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  mergedAt?: Date;
  closedAt?: Date;
  lastSyncedAt: Date;
}

// Code Review
export interface CodeReview extends BaseRecord {
  userId: RecordId<"user">;
  pullRequestId: RecordId<"pullRequest">;
  repositoryId: RecordId<"repository">;
  action: ReviewAction;
  comment?: string;
  submittedAt: Date;
}

// Commit Streak
export interface CommitStreak extends BaseRecord {
  userId: RecordId<"user">;
  currentStreak: number;
  longestStreak: number;
  lastCommitDate?: Date;
  totalCommits: number;
  totalPRs: number;
  totalReviews: number;
  weeklyContributions: Record<string, number>;
}

// Achievement
export interface Achievement extends BaseRecord {
  userId: RecordId<"user">;
  type: AchievementType;
  unlockedAt: Date;
  metadata?: Record<string, unknown>;
}

// Deployment
export interface Deployment extends BaseRecord {
  repositoryId: RecordId<"repository">;
  userId: RecordId<"user">;
  branch: string;
  commit?: string;
  status: DeploymentStatus;
  url?: string;
  previewUrl?: string;
  logs: string;
  buildDuration?: number;
  triggeredBy: "push" | "manual" | "pr";
  environment: "production" | "preview" | "staging";
  startedAt?: Date;
  finishedAt?: Date;
}

// Deployment Config
export interface DeploymentConfig extends BaseRecord {
  repositoryId: RecordId<"repository">;
  userId: RecordId<"user">;
  buildCommand: string;
  outputDir: string;
  envVars: Record<string, string>;
  autoDeploy: boolean;
  autoDeployBranch: string;
  customDomain?: string;
  framework?: string;
  nodeVersion?: string;
}

// AI Prompt History
export interface AIPromptHistory extends BaseRecord {
  userId: RecordId<"user">;
  prompt: string;
  response: string;
  model: string;
  tokens?: number;
  type: AIPromptType;
  metadata?: Record<string, unknown>;
}

// Activity Log
export interface ActivityLog extends BaseRecord {
  userId: RecordId<"user">;
  source: ActivitySource;
  type: ActivityType;
  title: string;
  description?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
}

// Repository
export interface Repository extends BaseRecord {
  userId: RecordId<"user">;
  externalId: string;
  provider: ActivitySource;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  homepage?: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language?: string;
  topics: string[];
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  ownerName: string;
  ownerAvatar?: string;
  pushedAt?: Date;
  lastSyncedAt: Date;
  syncStatus: SyncStatus;
}

// Repository Commit
export interface RepositoryCommit extends BaseRecord {
  repositoryId: RecordId<"repository">;
  sha: string;
  message: string;
  author: string;
  authorEmail?: string;
  authorAvatar?: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string;
  committedAt: Date;
}

// Repository Branch
export interface RepositoryBranch extends BaseRecord {
  repositoryId: RecordId<"repository">;
  name: string;
  isDefault: boolean;
  isProtected: boolean;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitDate?: Date;
}

// ─── Deploy Platform ──────────────────────────────────────────────────────────

export type DeployProjectStatus = "running" | "stopped" | "building" | "error" | "idle";
export type DeployProjectSourceType = "github" | "git" | "docker" | "template";

export interface DeployProject extends BaseRecord {
  userId: RecordId<"user">;
  name: string;
  description?: string;
  status: DeployProjectStatus;
  framework?: string;
  branch: string;
  gitUrl?: string;
  sourceType: DeployProjectSourceType;
  dockerImage?: string;
  buildCommand: string;
  outputDir: string;
  installCommand: string;
  rootDir: string;
  port: number;
  region: string;
  instances: number;
  url?: string;
  serverId?: RecordId<"deployServer">;
  lastDeployedAt?: Date;
}

export type DeployServerStatus = "online" | "offline" | "warning";

export interface DeployServer extends BaseRecord {
  userId: RecordId<"user">;
  name: string;
  provider: string;
  location: string;
  ip: string;
  os?: string;
  status: DeployServerStatus;
  uptime?: string;
  sshUser?: string;
  sshPort?: number;
  cpuCores?: number;
  memoryMb?: number;
  diskGb?: number;
}

export type DeployDatabaseType = "PostgreSQL" | "MySQL" | "Redis" | "MongoDB" | "MariaDB" | "ClickHouse";
export type DeployDatabaseStatus = "running" | "stopped" | "error";

export interface DeployDatabase extends BaseRecord {
  userId: RecordId<"user">;
  serverId?: RecordId<"deployServer">;
  name: string;
  dbType: DeployDatabaseType;
  version?: string;
  status: DeployDatabaseStatus;
  port: number;
  dbUser: string;
  dbPassword: string;
  host?: string;
  lastBackupAt?: Date;
}

export type DeployDomainStatus = "active" | "pending" | "error";

export interface DeployDomain extends BaseRecord {
  userId: RecordId<"user">;
  projectId: RecordId<"deployProject">;
  domain: string;
  domainType: "auto" | "custom";
  ssl: boolean;
  primary: boolean;
  status: DeployDomainStatus;
}

export type DeployEnvScope = "all" | "production" | "preview" | "development";

export interface DeployEnvVar extends BaseRecord {
  userId: RecordId<"user">;
  projectId: RecordId<"deployProject">;
  key: string;
  value: string;
  secret: boolean;
  scope: DeployEnvScope;
}

export type DeployChannelType =
  | "Slack" | "Discord" | "Telegram" | "Email"
  | "Webhook" | "Ntfy" | "Pushover" | "Gotify";

export interface DeployNotificationChannel extends BaseRecord {
  userId: RecordId<"user">;
  name: string;
  channelType: DeployChannelType;
  webhookUrl?: string;
  token?: string;
  chatId?: string;
  email?: string;
  events: string[];
  status: "active" | "inactive";
}
