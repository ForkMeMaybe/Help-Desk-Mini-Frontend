import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `JWT ${token}`;
    }
    // Attach Idempotency-Key for POST requests if not already provided
    if (config.method?.toLowerCase() === "post") {
      const providedKey = (config as any).idempotencyKey as string | undefined;
      const hasIdempotencyKey =
        config.headers &&
        ((config.headers as any)["Idempotency-Key"] ||
          (config.headers as any)["idempotency-key"]);
      if (providedKey && !hasIdempotencyKey) {
        (config.headers as any)["Idempotency-Key"] = providedKey;
      } else if (!hasIdempotencyKey) {
        (config.headers as any)["Idempotency-Key"] = crypto.randomUUID();
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url === "/auth/jwt/create/") {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `JWT ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/jwt/refresh/`,
          {
            refresh: refreshToken,
          },
          {
            headers: {
              "Content-Type": "application/json",
              // Ensure refresh POST is idempotent as well
              "Idempotency-Key": crypto.randomUUID(),
            },
          },
        );

        const { access } = response.data;
        localStorage.setItem("access_token", access);

        apiClient.defaults.headers.common["Authorization"] = `JWT ${access}`;
        originalRequest.headers.Authorization = `JWT ${access}`;

        processQueue(null, access);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
export const generateIdempotencyKey = (): string => crypto.randomUUID();
export const withIdempotencyKey = (key: string) => ({
  headers: { "Idempotency-Key": key },
});
