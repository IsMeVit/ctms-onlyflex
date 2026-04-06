import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "./app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Audit logging function
async function logAdminActivity(
  userId: string,
  action: string,
  details?: string
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        userId,
        action,
        details: details || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Log admin login if user is admin
        if (user.role === "ADMIN") {
          await logAdminActivity(user.id, "LOGIN", "Admin logged in successfully");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          membershipTier: user.membershipTier,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours for admin sessions (more secure)
    updateAge: 60 * 60, // Update session every hour
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.membershipTier = user.membershipTier;
        token.lastActivity = Date.now();
      }
      
      // Update last activity on every token use
      if (trigger === "update") {
        token.lastActivity = Date.now();
      }
      
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.membershipTier = token.membershipTier as string;
        session.user.lastActivity = token.lastActivity as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (token?.id && token?.role === "ADMIN") {
        await logAdminActivity(token.id as string, "LOGOUT", "Admin session ended");
      }
    },
  },
});

export { logAdminActivity };
