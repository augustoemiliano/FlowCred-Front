import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { clearToken, getToken, setToken as persistToken } from "@/lib/token";

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
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getToken());
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(() => getToken() !== null);

  useEffect(() => {
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<Me>("/auth/me")
      .then(({ data }) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) {
          clearToken();
          setToken(null);
          setMe(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<{ access_token: string; token_type: string }>("/auth/login", {
      username,
      password,
    });
    persistToken(data.access_token);
    setToken(data.access_token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setMe(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => ({ token, me, loading, login, logout }), [token, me, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
