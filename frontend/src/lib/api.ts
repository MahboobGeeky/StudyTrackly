import axios, { AxiosError } from "axios";
import { clearAuth } from "@/lib/auth";

const base = import.meta.env.VITE_API_URL ?? "";

const apiClient = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("studytrackly_token");
  if (token) {
    const h = config.headers;
    if (h && typeof (h as { set?: (k: string, v: string) => void }).set === "function") {
      (h as { set: (k: string, v: string) => void }).set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` } as typeof config.headers;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuth();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const body = init?.body ? JSON.parse(init.body as string) : undefined;

  try {
    const response = await apiClient.request<T>({
      url: path,
      method,
      data: body,
      headers: init?.headers as Record<string, string> | undefined,
    });

    return response.data as T;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      throw new Error(message);
    }
    throw err;
  }
}
