const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

/** Resolves API-hosted upload paths (e.g. /uploads/...) to a full URL. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
