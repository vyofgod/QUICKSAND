import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import GitLab from "next-auth/providers/gitlab";
import { db, helpers } from "@/lib/db";
import { SurrealDBAdapter } from "@/lib/surreal-adapter";
import { env } from "@/env";
import { RepositorySyncService } from "@/lib/integrations/repository-sync";

/**
 * Module augmentation for NextAuth types
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * NextAuth v5 configuration
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: SurrealDBAdapter(db),
  providers: [
    GitHub({
      clientId: env.AUTH_GITHUB_ID!,
      clientSecret: env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.login || profile.name, // Use login (username) as name
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    GitLab({
      clientId: env.AUTH_GITLAB_ID!,
      clientSecret: env.AUTH_GITLAB_SECRET!,
      authorization: {
        params: {
          scope: "read_user read_api read_repository",
        },
      },
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.username || profile.name, // Use username as name
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          name: user.name ?? session.user?.name,
          email: user.email ?? session.user?.email,
          image: user.image ?? session.user?.image,
        },
      };
    },
    async signIn({ user, account, profile }) {
      console.log(
        "[signIn callback] user:",
        user.id,
        "account:",
        account?.provider,
        "profile:",
        profile
      );

      // Store the username from the OAuth profile
      if (account && profile) {
        try {
          const userId = helpers.recordId("user", user.id ?? "");

          // Get the username from the profile
          let username: string | undefined;
          if (account.provider === "github" && "login" in profile) {
            username = profile.login as string;
          } else if (account.provider === "gitlab" && "username" in profile) {
            username = profile.username as string;
          }

          // Update both the user table and account table with the username
          if (username) {
            const rawId = helpers.extractId(String(userId));
            // Update user table with the username using type::thing for proper record ID resolution
            await db.query(
              `UPDATE type::thing('user', $rawId) SET name = $username`,
              { rawId, username }
            );
            console.log(`[signIn callback] Updated user.name: ${username}`);

            // Update the account with the username
            await db.query(
              `UPDATE account SET providerUsername = $username WHERE userId = $userId AND provider = $provider`,
              { userId, provider: account.provider, username }
            );
            console.log(
              `[signIn callback] Updated account username: ${username} for provider: ${account.provider}`
            );
          }
        } catch (error) {
          console.error("Error updating account username:", error);
        }
      }

      // Automatically sync repositories when user signs in with GitHub or GitLab
      if (account && user.id && account.access_token) {
        try {
          if (account.provider === "github") {
            // Sync GitHub repositories in the background
            RepositorySyncService.syncGitHubRepositories(
              user.id,
              account.access_token
            ).catch((error) => {
              console.error("Failed to sync GitHub repositories:", error);
            });
          } else if (account.provider === "gitlab") {
            // Sync GitLab repositories in the background
            RepositorySyncService.syncGitLabRepositories(
              user.id,
              account.access_token
            ).catch((error) => {
              console.error("Failed to sync GitLab repositories:", error);
            });
          }
        } catch (error) {
          console.error("Error initiating repository sync:", error);
          // Don't block sign-in if sync fails
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // set to true in production with HTTPS
      },
    },
  },
  debug: true,
});
