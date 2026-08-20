import type { ApiResponse } from "@nova-ai/shared";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class NovaApiError extends Error {
  code?: string;
  status: number;
  errors?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    code?: string,
    errors?: Record<string, string>
  ) {
    super(message);
    this.name = "NovaApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

type Listener = (token: string | null) => void;

class NovaApiClientImpl {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private listeners: Listener[] = [];

  setAccessToken(token: string | null) {
    this.accessToken = token;
    this.listeners.forEach((listener) => listener(token));
  }

  getAccessToken() {
    return this.accessToken;
  }

  onTokenChange(listener: Listener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retry = true
  ): Promise<T> {
    const headers = new Headers(init.headers);

    if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    let res: Response;

    try {
      res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        credentials: "include",
      });
    } catch {
      throw new NovaApiError(
        0,
        "Cannot connect to the server. Please check that the backend is running."
      );
    }

    if (res.status === 401 && retry && path !== "/api/auth/refresh") {
      const newToken = await this.refreshAccessToken();

      if (newToken) {
        return this.request<T>(path, init, false);
      }
    }

    const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

    if (!res.ok || !json || json.success === false) {
      const message =
        json?.message ||
        `Request failed with status ${res.status}`;

      const code = json?.code;
      const errors = json?.errors;

      throw new NovaApiError(res.status, message, code, errors);
    }

    return json.data;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          this.setAccessToken(null);
          return null;
        }

        const json =
          (await res.json()) as ApiResponse<{ accessToken: string }>;

        if (json.success && json.data?.accessToken) {
          this.setAccessToken(json.data.accessToken);
          return json.data.accessToken;
        }

        this.setAccessToken(null);
        return null;
      } catch {
        this.setAccessToken(null);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  get<T>(path: string) {
    return this.request<T>(path, {
      method: "GET",
    });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  postForm<T>(path: string, formData: FormData) {
    return this.request<T>(path, {
      method: "POST",
      body: formData,
    });
  }

  async getBlobUrl(path: string, retry = true): Promise<string> {
    const headers = new Headers();

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    let res: Response;

    try {
      res = await fetch(`${API_URL}${path}`, {
        headers,
        credentials: "include",
      });
    } catch {
      throw new NovaApiError(
        0,
        "Cannot connect to the server."
      );
    }

    if (res.status === 401 && retry) {
      const newToken = await this.refreshAccessToken();

      if (newToken) {
        return this.getBlobUrl(path, false);
      }
    }

    if (!res.ok) {
      throw new NovaApiError(
        res.status,
        "Couldn't load this file."
      );
    }

    const blob = await res.blob();

    return URL.createObjectURL(blob);
  }

  restoreSession() {
    return this.refreshAccessToken();
  }
}

export const NovaApiClient = new NovaApiClientImpl();