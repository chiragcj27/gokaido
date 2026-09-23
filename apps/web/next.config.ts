import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
