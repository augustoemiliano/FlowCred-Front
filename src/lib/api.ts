import axios, { isAxiosError } from "axios";

import { clearToken, getToken } from "@/lib/token";

const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Token expirado/inválido: limpa a sessão e volta ao login (exceto na própria chamada de login).
    const url = String(err.config?.url ?? "");
    if (err.response?.status === 401 && !url.includes("/auth/login")) {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

/**
 * Mensagem legível a partir de um erro da API FastAPI.
 * - `detail` string (404, 409, 413, 415…) é devolvido tal como vem;
 * - `detail` lista (422 de validação) junta as mensagens.
 */
export function apiErrorMessage(err: unknown, fallback = "Erro ao salvar. Verifique os dados."): string {
  if (!isAxiosError(err)) return fallback;
  if (!err.response) return "Não foi possível conectar à API. Verifique se o backend está rodando.";
  const data = err.response.data as { detail?: unknown } | undefined;
  const d = data?.detail;
  if (typeof d === "string" && d.trim()) return d;
  if (Array.isArray(d)) {
    const parts = (d as { msg?: string }[])
      .map((x) => x.msg?.replace(/^Value error, /, ""))
      .filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  return fallback;
}
