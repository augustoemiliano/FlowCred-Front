import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

type Me = { id: number; username: string; is_active: boolean; is_superuser: boolean; created_at: string };

type AuthContextValue = {
  token: string | null;
  me: Me | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("fc_token"));
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const { data } = await api.get<Me>("/auth/me");
    setMe(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setMe(null);
        setLoading(false);
        return;
      }
      try {
        await loadMe();
      } catch {
        if (!cancelled) {
          localStorage.removeItem("fc_token");
          setToken(null);
          setMe(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, loadMe]);

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await api.post<{ access_token: string; token_type: string }>("/auth/login", {
        username,
        password,
      });
      localStorage.setItem("fc_token", data.access_token);
      setToken(data.access_token);
      await loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("fc_token");
    setToken(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ token, me, loading, login, logout }),
    [token, me, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
