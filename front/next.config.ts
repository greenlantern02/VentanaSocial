import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('http://localhost:8000/uploads/**'), new URL('https://localhost:8000/uploads/**')],
  },};

export default nextConfig;
