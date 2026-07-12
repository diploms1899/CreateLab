import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

let apiInstance: AxiosInstance | null = null;

export function getApi(): AxiosInstance {
  const store = useAuthStore.getState();

  // Recreate the instance if the server URL changed
  if (apiInstance && apiInstance.defaults.baseURL !== store.serverUrl + "/api/v1") {
    apiInstance = null;
  }

  if (apiInstance) return apiInstance;
  apiInstance = axios.create({
    baseURL: store.serverUrl + "/api/v1",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  apiInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          try {
            const response = await axios.post(
              `${useAuthStore.getState().serverUrl}/api/v1/auth/refresh`,
              { refresh_token: refreshToken }
            );
            const { access_token, refresh_token } = response.data;
            useAuthStore.getState().setTokens(access_token, refresh_token);
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiInstance!(originalRequest);
          } catch {
            useAuthStore.getState().logout();
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
}

// Auth API
export const authApi = {
  login: (username: string, password: string, deviceId?: string) =>
    getApi().post("/auth/login", { username, password, device_id: deviceId }),

  register: (username: string, email: string, password: string) =>
    getApi().post("/auth/register", { username, email, password }),

  getMe: () => getApi().get("/auth/me"),

  registerDevice: (deviceId: string, fingerprint: string, key: string) =>
    getApi().post("/auth/devices/register", {
      device_id: deviceId,
      hardware_fingerprint: fingerprint,
      secure_random_key: key,
    }),
};

// Projects API
export const projectsApi = {
  getTemplates: () => getApi().get("/projects/templates"),

  getTemplate: (slug: string) => getApi().get(`/projects/templates/${slug}`),

  createProject: (templateSlug: string, name: string) =>
    getApi().post("/projects/", { template_slug: templateSlug, name }),

  listProjects: () => getApi().get("/projects/"),
};

// Sync API
export const syncApi = {
  syncWorkspace: (workspaceId: string, files: unknown[], deletedFiles: string[] = []) =>
    getApi().post(`/sync/workspace/${workspaceId}`, {
      workspace_id: workspaceId,
      files,
      deleted_files: deletedFiles,
    }),
};
