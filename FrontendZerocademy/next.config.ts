import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables smaller production Docker images (see FrontendZerocademy/Dockerfile production target)
  output: "standalone",
};

export default nextConfig;
