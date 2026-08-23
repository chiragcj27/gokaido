"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY, REFRESH_KEY } from "./api";

export interface AdminUser {
  id: string;
  name?: string;
  mobile: string;
  role: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AdminUser | null;
  status: AuthStatus;
  login: (accessToken: string, refreshToken: string) => Promise<AdminUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const ADMIN_ROLES = new Set(["admin", "superadmin"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: AdminUser }>("/api/auth/me");
      if (!ADMIN_ROLES.has(user.role)) {
        logout();
        return;
      }
      setUser(user);
      setStatus("authenticated");
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setStatus("unauthenticated");
      return;
    }
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);

    const { user } = await api.get<{ user: AdminUser }>("/api/auth/me");
    if (!ADMIN_ROLES.has(user.role)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      throw new Error("This account does not have admin access.");
    }

    setUser(user);
    setStatus("authenticated");
    return user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
