import { getApiBaseUrl } from "@/lib/api-base-url";

/** Resolves API-hosted upload paths (e.g. /uploads/...) to a full URL. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
