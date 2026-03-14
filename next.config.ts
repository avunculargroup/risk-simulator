import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bullmq", "ioredis", "postgres"],
  output: "standalone",
};

export default nextConfig;
