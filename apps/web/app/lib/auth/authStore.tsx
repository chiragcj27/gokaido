"use client";

// Customer session for the storefront. OTP-only login (no passwords) against
// the website's own API — see CLAUDE.md. Tokens live in localStorage so the
// session survives reloads; `authFetch` transparently swaps an expired access
// token for a new one via the refresh token before giving up.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const STORAGE_KEY = "gokaido_auth";

export interface AuthUser {
  _id?: string;
  id?: string;
  name?: string;
  mobile?: string;
  email?: string;
  dob?: string;
  region?: string;
  language: "en" | "hi" | "mr" | "ta";
  rewardPoints: number;
  referralCode?: string;
  notifications?: { whatsapp: boolean; sms: boolean; email: boolean };
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

type Status = "loading" | "guest" | "authenticated";

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  setSession: (tokens: Tokens, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  authFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Unauthenticated call to the API (`path` is relative to `/api`). Throws ApiRequestError with the API's own message. */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiRequestError(res.status, body.error ?? "Something went wrong. Please try again.");
  return body as T;
}

function readTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function writeTokens(tokens: Tokens | null) {
  try {
    if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode etc.) — session just won't persist.
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = useCallback(() => {
    writeTokens(null);
    setUser(null);
    setStatus("guest");
  }, []);

  const authFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const tokens = readTokens();
      if (!tokens) throw new ApiRequestError(401, "Please log in.");

      const call = (accessToken: string) =>
        apiRequest<T>(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${accessToken}` } });

      try {
        return await call(tokens.accessToken);
      } catch (err) {
        if (!(err instanceof ApiRequestError) || err.status !== 401) throw err;
        try {
          const { accessToken } = await apiRequest<{ accessToken: string }>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          });
          writeTokens({ ...tokens, accessToken });
          return await call(accessToken);
        } catch (refreshErr) {
          if (refreshErr instanceof ApiRequestError && refreshErr.status === 401) logout();
          throw refreshErr;
        }
      }
    },
    [logout],
  );

  // Restore the session on first load.
  useEffect(() => {
    if (!readTokens()) {
      setStatus("guest");
      return;
    }
    authFetch<{ user: AuthUser }>("/auth/me")
      .then(({ user }) => {
        setUser(user);
        setStatus("authenticated");
      })
      .catch(() => logout());
  }, [authFetch, logout]);

  const setSession = useCallback((tokens: Tokens, nextUser: AuthUser) => {
    writeTokens(tokens);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const value = useMemo(
    () => ({ status, user, setSession, setUser, logout, authFetch }),
    [status, user, setSession, logout, authFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
