import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "maher.mahershadi.com", pathname: "/**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
