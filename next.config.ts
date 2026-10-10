import type { NextConfig } from "next";

/**
 * When GITHUB_PAGES=true is set at build time, the project is exported as a
 * fully static site (output: "export") suitable for hosting on GitHub Pages
 * (or any static HTTPS host). Otherwise it builds in "standalone" mode used
 * by the local Docker/Caddyfile deployment.
 *
 * For project pages (https://<user>.github.io/<repo>/), set
 * NEXT_PUBLIC_BASE_PATH="/<repo>" so all asset URLs are prefixed correctly.
 * For user/org pages (https://<user>.github.io/), leave it empty.
 */
const isGithubPages =
  process.env.GITHUB_PAGES === "true" || process.env.GITHUB_PAGES === "1";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  // GitHub Pages doesn't run the Next.js image optimization server, so emit
  // raw image URLs. (We only use inline SVG icons, so this is a no-op, but
  // keeps the build clean if a `next/image` is added later.)
  images: { unoptimized: true },
  // Trailing slashes so subpath file hosting resolves directories cleanly
  // and GitHub Pages doesn't 301 redirect /repo -> /repo/.
  trailingSlash: true,
  // Apply basePath + assetPrefix only when the user opts in (project pages).
  ...(isGithubPages && basePath
    ? { basePath, assetPrefix: basePath }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
