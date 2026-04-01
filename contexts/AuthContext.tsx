
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SessionProvider,
  signIn,
  signOut,
  useSession,
} from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAvatar?: (fileOrBase64: File | string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

function AuthStateProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [avatarOverride, setAvatarOverride] = useState<string>();

  const user = useMemo<User | null>(() => {
    if (!session?.user?.email || !session.user.id) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name || session.user.email,
      email: session.user.email,
      avatarUrl: avatarOverride || session.user.image || undefined,
    };
  }, [avatarOverride, session]);

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error("Invalid email or password");
    }
  };

  const logout = () => {
    void signOut({ callbackUrl: "/" });
  };

  const updateAvatar = async (fileOrBase64: File | string) => {
    if (typeof fileOrBase64 === "string") {
      setAvatarOverride(fileOrBase64);
      return;
    }

    setAvatarOverride(URL.createObjectURL(fileOrBase64));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: status === "authenticated",
        isInitialized: status !== "loading",
        isLoading: status === "loading",
        login,
        logout,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <AuthStateProvider>{children}</AuthStateProvider>
    </SessionProvider>
  );
};
