import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so Next.js ignores the stray lockfile in the parent folder.
  turbopack: { root: path.join(__dirname) },
  // Let phones and other devices on the home Wi-Fi load the dev site
  // (e.g. http://192.168.1.3:3000). Without this, Next.js blocks the scripts
  // and nothing animates on the phone.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  experimental: {
    // Recipient lists are sent with the campaign form (≈ 250K numbers max).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
