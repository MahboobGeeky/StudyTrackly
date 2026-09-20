import axios from "axios";
import { clearAuth } from "@/lib/auth";

const base = import.meta.env.VITE_API_URL ?? "";

const apiClient = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("studytrackly_token");
  if (token) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export async function api(path, init) {
  const method = (init?.method ?? "GET").toUpperCase();
  const body = init?.body ? JSON.parse(init.body) : undefined;

  try {
    const response = await apiClient.request({
      url: path,
      method,
      data: body,
      headers: init?.headers,
    });

    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      throw new Error(message);
    }
    throw err;
  }
}
