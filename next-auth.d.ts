import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
      membershipTier?: string;
      lastActivity?: number;
    };
  }

  interface User {
    id: string;
    role?: string;
    membershipTier?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    membershipTier?: string;
    lastActivity?: number;
  }
}
