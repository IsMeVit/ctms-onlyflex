import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      phone?: string | null;
      role?: string;
      membershipTier?: string;
      lastActivity?: number;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    phone?: string | null;
    role?: string;
    membershipTier?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    phone?: string | null;
    role?: string;
    membershipTier?: string;
    lastActivity?: number;
  }
}
