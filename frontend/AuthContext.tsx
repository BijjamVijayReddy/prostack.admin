"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";
const TOKEN_KEY = "prostack_token";
// Show warning N ms before expiry — configurable via .env.local
const WARN_BEFORE_MS = Number(process.env.NEXT_PUBLIC_SESSION_WARN_BEFORE_MS ?? 60_000);

export type LoginResult = "ok" | "invalid" | "error";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  username: string;
  role: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  authChecked: boolean;
  user: AuthUser | null;
  sessionWarning: boolean;
  sessionExpiresAt: number | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  extendSession: () => Promise<void>;
  getToken: () => string | null;
  setUser: (u: AuthUser) => void;
}

/** Decode JWT payload without a library */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
  }, []);

  /** Schedule the warning dialog and hard-logout based on token exp */
  const scheduleExpiry = useCallback(
    (token: string) => {
      clearTimers();
      const expiry = getTokenExpiry(token);
      if (!expiry) return;
      const now = Date.now();
      const msUntilWarn = expiry - now - WARN_BEFORE_MS;
      const msUntilExpire = expiry - now;

      setSessionExpiresAt(expiry);

      if (msUntilWarn > 0) {
        warnTimerRef.current = setTimeout(() => setSessionWarning(true), msUntilWarn);
      } else {
        // Token already past warning threshold — show immediately
        setSessionWarning(true);
      }

      if (msUntilExpire > 0) {
        expireTimerRef.current = setTimeout(() => {
          setSessionWarning(false);
          setSessionExpiresAt(null);
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
        }, msUntilExpire);
      }
    },
    [clearTimers]
  );

  // On mount, verify stored token with backend /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthChecked(true);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json() as { user: AuthUser & { _id?: string } };
          const u = data.user;
          setUser({ ...u, id: u._id ?? u.id });
          setIsAuthenticated(true);
          scheduleExpiry(token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setAuthChecked(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
          const data = await res.json() as { token: string; user: { lastLoginAt?: string } };
          localStorage.setItem(TOKEN_KEY, data.token);

          // Fetch full user details
          const meRes = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json() as { user: AuthUser & { _id?: string } };
            const u = meData.user;
            setUser({ ...u, id: u._id ?? u.id, lastLoginAt: data.user.lastLoginAt });
          }

          setIsAuthenticated(true);
          scheduleExpiry(data.token);
          return "ok";
        }

        if (res.status === 401) return "invalid";
        return "error";
      } catch {
        return "error";
      }
    },
    [scheduleExpiry]
  );

  const logout = useCallback(() => {
    clearTimers();
    setSessionWarning(false);
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  }, [clearTimers]);

  const extendSession = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) { logout(); return; }
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json() as { token: string };
        localStorage.setItem(TOKEN_KEY, data.token);
        setSessionWarning(false);
        scheduleExpiry(data.token);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [logout, scheduleExpiry]);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authChecked, user, sessionWarning, sessionExpiresAt, login, logout, extendSession, getToken, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
