/**
 * SurrealDB Adapter for NextAuth v5
 */
import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from "next-auth/adapters";
import type Surreal from "surrealdb";
import { helpers, type RecordId } from "./db";

export function SurrealDBAdapter(db: Surreal): Adapter {
  return {
    async createUser(user) {
      // Let SurrealDB generate its own ID
      const [result] = await db.create<AdapterUser>("user", {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });

      const finalId = helpers.extractId(result.id as string);
      console.log(`[createUser] Created: ${result.id}, extracted: ${finalId}`);

      return {
        ...result,
        id: finalId,
        emailVerified: result.emailVerified ?? null,
      };
    },

    async getUser(id) {
      const recordId = helpers.recordId("user", id);
      const [result] = await db.select<AdapterUser>(recordId);

      if (!result) return null;

      return {
        ...result,
        id: helpers.extractId(result.id as string),
        emailVerified: result.emailVerified ?? null,
      };
    },

    async getUserByEmail(email) {
      const results = await db.query<[AdapterUser[]]>(
        `SELECT * FROM user WHERE email = $email LIMIT 1`,
        { email }
      );

      const user = results[0]?.[0];
      if (!user) return null;

      return {
        ...user,
        id: helpers.extractId(user.id as string),
        emailVerified: user.emailVerified ?? null,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const results = await db.query<[Array<{ userId: RecordId<"user"> }>]>(
        `SELECT userId FROM account WHERE provider = $provider AND providerAccountId = $providerAccountId LIMIT 1`,
        { provider, providerAccountId }
      );

      const account = results[0]?.[0];
      if (!account) return null;

      const userId = helpers.extractId(account.userId as string);

      // Fetch user directly
      const recordId = helpers.recordId("user", userId);
      const [userResult] = await db.select<AdapterUser>(recordId);

      if (!userResult) return null;

      return {
        ...userResult,
        id: helpers.extractId(userResult.id as string),
        emailVerified: userResult.emailVerified ?? null,
      };
    },

    async updateUser(user) {
      const recordId = helpers.recordId("user", user.id);
      const [result] = await db.merge<AdapterUser>(recordId, {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });

      return {
        ...result,
        id: helpers.extractId(result.id as string),
        emailVerified: result.emailVerified ?? null,
      };
    },

    async deleteUser(userId) {
      const recordId = helpers.recordId("user", userId);

      // Delete related records
      await db.query(
        `DELETE account WHERE userId = $userId;
         DELETE session WHERE userId = $userId;`,
        { userId: recordId }
      );

      await db.delete(recordId);
    },

    async linkAccount(account) {
      // Extract plain ID if it's in RecordId format
      const plainUserId = account.userId.includes(":")
        ? helpers.extractId(account.userId)
        : account.userId;
      const userId = helpers.recordId("user", plainUserId);

      console.log(
        `[linkAccount] Input userId: ${account.userId}, plain: ${plainUserId}, storing: ${userId}`
      );

      await db.create("account", {
        userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });

      return account as AdapterAccount;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db.query(
        `DELETE account WHERE provider = $provider AND providerAccountId = $providerAccountId`,
        { provider, providerAccountId }
      );
    },

    async createSession({ sessionToken, userId, expires }) {
      // userId might already be in RecordId format (user:id) or plain format (id)
      // Extract the plain ID first
      const plainUserId = userId.includes(":")
        ? helpers.extractId(userId)
        : userId;
      const userRecordId = helpers.recordId("user", plainUserId);

      const [result] = await db.create<AdapterSession>("session", {
        sessionToken,
        userId: userRecordId,
        expires: new Date(expires),
      });

      console.log(
        `[createSession] Input userId: ${userId}, plain: ${plainUserId}, stored: ${userRecordId}`
      );

      return {
        sessionToken: result.sessionToken,
        userId: plainUserId, // Return plain ID
        expires: new Date(result.expires),
      };
    },

    async getSessionAndUser(sessionToken) {
      try {
        const results = await db.query<
          [Array<AdapterSession & { userId: RecordId<"user"> }>]
        >(`SELECT * FROM session WHERE sessionToken = $sessionToken LIMIT 1`, {
          sessionToken,
        });

        // In SurrealDB.js 1.0.0, query might return an error object if it fails
        const result = results[0];
        if (result instanceof Error || (result as any).status === "ERR") {
          console.error("SurrealDB Adapter Error (getSessionAndUser):", result);
          return null;
        }

        const session = results[0]?.[0];
        if (!session) {
          console.log(
            `[getSessionAndUser] No session found for token: ${sessionToken}`
          );
          return null;
        }

        // Check if session is expired
        const expiresDate = new Date(session.expires);
        if (expiresDate < new Date()) {
          console.log(`[getSessionAndUser] Session expired: ${sessionToken}`);
          return null;
        }

        const userId = helpers.extractId(session.userId as string);
        // Clean any special characters that might come from SurrealDB
        const cleanUserId = userId.replace(/[⟨⟩]/g, "").trim();
        console.log(
          `[getSessionAndUser] Session userId: ${session.userId}, extracted: ${userId}, clean: ${cleanUserId}`
        );

        // Fetch user directly
        const recordId = helpers.recordId("user", cleanUserId);
        console.log(`[getSessionAndUser] Looking for recordId: ${recordId}`);

        const userResults = await db.query<[AdapterUser[]]>(
          `SELECT * FROM type::thing('user', $userId) LIMIT 1`,
          { userId: cleanUserId }
        );
        const userResult = userResults[0]?.[0];

        console.log(
          `[getSessionAndUser] Query result:`,
          JSON.stringify(userResult)
        );

        if (!userResult) {
          console.log(
            `[getSessionAndUser] User not found for recordId: ${recordId}`
          );

          // Debug: Check all users
          const allUsers =
            await db.query<[AdapterUser[]]>(`SELECT * FROM user`);
          console.log(
            `[getSessionAndUser] All users in DB:`,
            allUsers[0]?.map((u) => u.id)
          );

          return null;
        }

        const user = {
          ...userResult,
          id: helpers.extractId(userResult.id as string),
          emailVerified: userResult.emailVerified ?? null,
        };

        console.log(
          `[getSessionAndUser] Success for user:`,
          user.id,
          user.name,
          user.email
        );

        return {
          session: {
            sessionToken: session.sessionToken,
            userId: cleanUserId,
            expires: expiresDate,
          },
          user,
        };
      } catch (error) {
        console.error("SurrealDB Adapter Crash (getSessionAndUser):", error);
        return null;
      }
    },

    async updateSession({ sessionToken, expires, userId }) {
      const results = await db.query<
        [Array<AdapterSession & { userId: RecordId<"user"> }>]
      >(`SELECT * FROM session WHERE sessionToken = $sessionToken LIMIT 1`, {
        sessionToken,
      });

      const session = results[0]?.[0];
      if (!session) return null;

      const updates: Partial<AdapterSession> = {};
      if (expires) updates.expires = expires;
      if (userId) updates.userId = helpers.recordId("user", userId) as any;

      const [updated] = await db.merge<AdapterSession>(
        session.id as RecordId,
        updates
      );

      return {
        sessionToken: updated.sessionToken,
        userId: helpers.extractId(updated.userId as string),
        expires: updated.expires,
      };
    },

    async deleteSession(sessionToken) {
      await db.query(`DELETE session WHERE sessionToken = $sessionToken`, {
        sessionToken,
      });
    },

    async createVerificationToken({ identifier, expires, token }) {
      await db.create("verificationToken", {
        identifier,
        token,
        expires,
      });

      return { identifier, token, expires };
    },

    async useVerificationToken({ identifier, token }) {
      const results = await db.query<[VerificationToken[]]>(
        `SELECT * FROM verificationToken WHERE identifier = $identifier AND token = $token LIMIT 1`,
        { identifier, token }
      );

      const verificationToken = results[0]?.[0];
      if (!verificationToken) return null;

      await db.query(
        `DELETE verificationToken WHERE identifier = $identifier AND token = $token`,
        { identifier, token }
      );

      return verificationToken;
    },
  };
}
