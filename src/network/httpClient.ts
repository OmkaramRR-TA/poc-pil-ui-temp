import axios from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TIMEOUT = 30_000;

const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const apiError: ApiError = {
      message: "An unexpected error occurred.",
      status: error.response?.status,
    };

    if (error.response) {
      const { status, data } = error.response;
      apiError.message = data?.message ?? error.message;
      apiError.code = data?.code;

      if (status === 401) {
        localStorage.removeItem("auth_token");
        // Redirect to login or dispatch logout action here if needed
        window.location.href = "/login";
      }
    } else if (error.request) {
      apiError.message = "No response received from server.";
    }

    return Promise.reject(apiError);
  },
);

// ── Generic request helpers ───────────────────────────────────────────────────
export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  httpClient.get<T>(url, config).then((r) => r.data);

export const post = <T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> => httpClient.post<T>(url, body, config).then((r) => r.data);

export const put = <T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> => httpClient.put<T>(url, body, config).then((r) => r.data);

export const patch = <T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> => httpClient.patch<T>(url, body, config).then((r) => r.data);

export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  httpClient.delete<T>(url, config).then((r) => r.data);

export default httpClient;
