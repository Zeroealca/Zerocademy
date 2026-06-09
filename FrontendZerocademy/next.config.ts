import type { NextConfig } from "next";

const internalApiUrl =
  process.env.INTERNAL_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  // Enables smaller production Docker images (see FrontendZerocademy/Dockerfile production target)
  output: "standalone",
  async rewrites() {
    return [
      { source: "/v1/:path*", destination: `${internalApiUrl}/v1/:path*` },
      { source: "/uploads/:path*", destination: `${internalApiUrl}/uploads/:path*` },
      { source: "/health", destination: `${internalApiUrl}/health` },
    ];
  },
};

export default nextConfig;
