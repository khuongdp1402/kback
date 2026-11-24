import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Docker/self-hosted builds; let Vercel use its native output tracing.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  serverExternalPackages: ["ffmpeg-static", "fluent-ffmpeg"],
};

export default nextConfig;
