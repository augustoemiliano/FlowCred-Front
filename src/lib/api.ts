import axios, { isAxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("fc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fc_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

/** Mensagem legível a partir de respostas 422 do FastAPI (campo `detail`). */
export function messageFromAxios422(err: unknown): string {
  if (!isAxiosError(err) || err.response?.status !== 422) {
    return "Erro ao salvar. Verifique os dados.";
  }
  const data = err.response.data as { detail?: unknown };
  const d = data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    const parts = (d as { msg?: string; loc?: unknown[] }[])
      .map((x) => x.msg)
      .filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  return "Dados inválidos.";
}
