import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/A-stock-king" : "";

const nextConfig: NextConfig = {
  agentRules: false,
  // Preview iframes often send Origin: null; allow it so /_next assets are not blocked in next dev.
  allowedDevOrigins: ["127.0.0.1", "localhost", "null"],
  ...(isGithubPages
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
