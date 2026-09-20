import { getApiBaseUrl } from "@/lib/api-base-url";
import { ApiError, isApiErrorBody } from "@/lib/api-error";
import { useAuthStore } from "@/stores/use-auth-store";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    if (!response.ok) {
      throw new ApiError({
        statusCode: response.status,
        message: response.statusText || "La solicitud falló",
        error: "Error",
      });
    }

    return undefined as T;
  }

  const payload: unknown = await response.json();

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      throw new ApiError(payload);
    }

    throw new ApiError({
      statusCode: response.status,
      message: "La solicitud falló",
      error: "Error",
    });
  }

  return payload as T;
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuth();
      return false;
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
      user: Parameters<typeof setTokens>[2];
    };

    setTokens(data.accessToken, data.refreshToken, data.user);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

export async function apiUploadClient<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, "body"> = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path}`;

  const requestHeaders = new Headers(headers);

  if (!skipAuth) {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const execute = () =>
    fetch(url, {
      ...rest,
      method: rest.method ?? "POST",
      headers: requestHeaders,
      body: formData,
    });

  let response = await execute();

  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        requestHeaders.set("Authorization", `Bearer ${accessToken}`);
      }
      response = await execute();
    }
  }

  return parseResponse<T>(response);
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path}`;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (!skipAuth) {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const execute = () =>
    fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await execute();
  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        requestHeaders.set("Authorization", `Bearer ${accessToken}`);
      }
      response = await execute();
    }
  }

  return parseResponse<T>(response);
}

/** Authenticated binary download with the same one-time token refresh as apiClient. */
export async function apiDownloadClient(path: string): Promise<Blob> {
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path}`;
  const requestHeaders = new Headers();
  const setAuthorization = () => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  };
  setAuthorization();

  let response = await fetch(url, { headers: requestHeaders });
  if (response.status === 401 && (await refreshAccessToken())) {
    setAuthorization();
    response = await fetch(url, { headers: requestHeaders });
  }

  if (!response.ok) {
    throw new ApiError({
      statusCode: response.status,
      message: response.statusText || "No se pudo descargar el archivo",
      error: "Error",
    });
  }

  return response.blob();
}
