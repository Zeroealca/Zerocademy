const DEFAULT_SERVER_API_URL = "https://zerocademy.onrender.com";

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Backend URL for server-side requests and Next.js rewrites. */
export function getServerApiBaseUrl(): string {
  return normalizeUrl(
    process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_SERVER_API_URL,
  );
}

/**
 * API base URL for fetch calls.
 * In the browser we use same-origin paths so Next.js can proxy to the API (LAN-friendly).
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }

  return getServerApiBaseUrl();
}
