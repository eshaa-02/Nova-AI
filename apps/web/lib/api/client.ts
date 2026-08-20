import type { ApiResponse } from "@nova-ai/shared";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

type Listener = (token: string | null) => void;

/**
 * NovaApiClient centralizes every HTTP call the frontend makes.
 * Components must never call `fetch` directly against the backend —
 * they go through here so auth headers, refresh-on-401, and error
 * shapes stay consistent in exactly one place.
 */
class NovaApiClientImpl {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private listeners: Listener[] = [];

  setAccessToken(token: string | null) {
    this.accessToken = token;
    this.listeners.forEach((l) => l(token));
  }

  getAccessToken() {
    return this.accessToken;
  }

  onTokenChange(listener: Listener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retry = true
  ): Promise<T> {
    const headers = new Headers(init.headers);

    if (
      !(init.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });

    // Try refreshing access token if unauthorized
    if (
      res.status === 401 &&
      retry &&
      path !== "/api/auth/refresh"
    ) {
      const newToken = await this.refreshAccessToken();

      if (newToken) {
        return this.request<T>(path, init, false);
      }
    }

    const json = (await res
      .json()
      .catch(() => null)) as ApiResponse<T> | null;

    if (!res.ok || !json || json.success === false) {
      const message =
        json && "message" in json
          ? json.message ??
          "Something went wrong. Please try again."
          : "Something went wrong. Please try again.";

      const code =
        json && json.success === false
          ? json.code
          : undefined;

      const errors =
        json && json.success === false
          ? json.errors
          : undefined;

      throw new NovaApiError(
        res.status,
        message,
        code,
        errors
      );
    } // <-- THIS WAS MISSING

    return json.data;
  }

  /**
   * De-duplicates concurrent refresh calls so a burst of 401s
   * only triggers one network request.
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!res.ok) {
          this.setAccessToken(null);
          return null;
        }

        const json =
          (await res.json()) as ApiResponse<{
            accessToken: string;
          }>;

        if (json.success) {
          this.setAccessToken(
            json.data.accessToken
          );

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
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  }

  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "DELETE",
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  }

  postForm<T>(
    path: string,
    formData: FormData
  ) {
    return this.request<T>(path, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Fetches a binary resource behind auth
   * and returns an object URL.
   */
  async getBlobUrl(
    path: string,
    retry = true
  ): Promise<string> {
    const headers = new Headers();

    if (this.accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${this.accessToken}`
      );
    }

    const res = await fetch(
      `${API_URL}${path}`,
      {
        headers,
        credentials: "include",
      }
    );

    if (res.status === 401 && retry) {
      const newToken =
        await this.refreshAccessToken();

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

  /**
   * Attempts silent session restoration on app load
   * using the refresh cookie.
   */
  restoreSession() {
    return this.refreshAccessToken();
  }
}

export const NovaApiClient =
  new NovaApiClientImpl();