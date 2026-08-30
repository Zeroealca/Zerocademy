import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { networkInterfaces } from "os";
import { resolve } from "path";

// Monorepo root .env (LAN_HOST, etc.) + FrontendZerocademy/.env*
const frontendDir = resolve(__dirname);
const repoRoot = resolve(frontendDir, "..");
loadEnvConfig(repoRoot);
loadEnvConfig(frontendDir);

const internalApiUrl =
  process.env.INTERNAL_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

/** Hostnames other devices use to open this Next.js dev server (LAN testing). */
function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1"]);

  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        origins.add(entry.address);
      }
    }
  }

  const lanHost = process.env.LAN_HOST?.trim();
  if (lanHost) {
    origins.add(lanHost.replace(/^https?:\/\//, "").split(":")[0] ?? lanHost);
  }

  for (const origin of process.env.ALLOWED_DEV_ORIGINS?.split(",") ?? []) {
    const trimmed = origin.trim();
    if (trimmed) {
      origins.add(trimmed.replace(/^https?:\/\//, "").split("/")[0] ?? trimmed);
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  // Enables smaller production Docker images (see FrontendZerocademy/Dockerfile production target)
  output: "standalone",
  // Next.js 15+ blocks /_next/* from non-localhost origins unless listed here.
  // Without this, LAN clients get HTML but no JS (login, buttons, etc. dead).
  allowedDevOrigins: getAllowedDevOrigins(),
  async rewrites() {
    return [
      { source: "/v1/:path*", destination: `${internalApiUrl}/v1/:path*` },
      { source: "/uploads/:path*", destination: `${internalApiUrl}/uploads/:path*` },
      { source: "/health", destination: `${internalApiUrl}/health` },
    ];
  },
};

export default nextConfig;
