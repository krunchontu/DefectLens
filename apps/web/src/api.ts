import type { ApiError, Dashboard, Defect, DefectInput, DefectSummary } from "./types";

export const API_BASE = import.meta.env.DEV ? "/api" : `${import.meta.env.VITE_API_BASE_URL}/api`;

export class ApiClientError extends Error {
  fields?: Record<string, string>;
  code?: string;

  constructor(payload: ApiError) {
    super(payload.error);
    this.fields = payload.fields;
    this.code = payload.code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiClientError(body ?? { error: "Request failed" });
  }

  return body as T;
}

export const api = {
  dashboard: () => request<Dashboard>("/dashboard"),
  listDefects: () => request<DefectSummary[]>("/defects"),
  getDefect: (id: string) => request<Defect>(`/defects/${id}`),
  createDefect: (input: DefectInput) =>
    request<Defect>("/defects", { method: "POST", body: JSON.stringify(input) }),
  updateDefect: (id: string, input: Partial<DefectInput>) =>
    request<Defect>(`/defects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteDefect: (id: string) => request<{ success: true }>(`/defects/${id}`, { method: "DELETE" }),
  analyzeDefect: (id: string) => request<Defect>(`/defects/${id}/analyze`, { method: "POST" })
};
