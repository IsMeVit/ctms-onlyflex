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

        const identifier = (credentials.email as string).trim();
        const emailIdentifier = identifier.toLowerCase();
        const phoneIdentifier = identifier.replace(/\D/g, "");
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: emailIdentifier },
              ...(phoneIdentifier ? [{ phone: phoneIdentifier }] : []),
            ],
          },
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

        // Log front-desk login
        if (user.role === "FRONT_DESK") {
          await logAdminActivity(user.id, "FRONT_DESK_LOGIN", "Front desk staff logged in");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          phone: user.phone,
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
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? undefined;
        token.email = user.email ?? undefined;
        token.picture = user.image ?? undefined;
        token.phone = user.phone ?? undefined;
        token.role = user.role;
        token.membershipTier = user.membershipTier;
        token.lastActivity = Date.now();
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            role: true,
            membershipTier: true,
          },
        });

        if (dbUser) {
          token.name = dbUser.name ?? undefined;
          token.email = dbUser.email ?? undefined;
          token.picture = dbUser.image ?? undefined;
          token.phone = dbUser.phone ?? undefined;
          token.role = dbUser.role;
          token.membershipTier = dbUser.membershipTier;
        }
      }

      if (trigger === "update") {
        token.lastActivity = Date.now();
      }
      
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | null | undefined) ?? undefined;
        session.user.email = (token.email as string | null | undefined) ?? undefined;
        session.user.image = (token.picture as string | null | undefined) ?? undefined;
        session.user.phone = (token.phone as string | null | undefined) ?? undefined;
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
