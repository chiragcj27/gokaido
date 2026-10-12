import os from "os";
import path from "path";
import type { NextConfig } from "next";

// This machine's LAN IPv4 addresses, so a phone on the same Wi-Fi can open the
// dev server (http://<lan-ip>:3000) — Next blocks dev-only resources such as
// the hot-reload socket for origins not listed here. Dev-only; no effect on
// production builds.
const lanHosts = Object.values(os.networkInterfaces())
  .flat()
  .filter((i): i is os.NetworkInterfaceInfo => !!i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanHosts,
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    // Next 16 requires every quality value actually used by an <Image> to be
    // declared here — 75 is next/image's own default (used wherever no
    // `quality` prop is passed, e.g. Hero's background), 70 is Footer.tsx's
    // explicit choice.
    qualities: [70, 75],
    // Product/review media is uploaded to the public prefix of the S3 bucket by the API.
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.AWS_S3_BUCKET ?? "gokaido-web-storage"}.s3.${process.env.AWS_REGION ?? "ap-south-1"}.amazonaws.com`,
        pathname: "/public/**",
      },
    ],
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/.turbo/**"],
    };
    return config;
  },
};

export default nextConfig;
