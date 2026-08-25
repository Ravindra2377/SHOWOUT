import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  typedRoutes: false,
  async headers() {
    const origin = process.env.EXPO_WEB_ORIGIN ?? (process.env.NODE_ENV === "development" ? "*" : null);
    if (!origin) return [];
    return [{ source: "/api/:path*", headers: [
      { key: "Access-Control-Allow-Origin", value: origin },
      { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
      { key: "Access-Control-Max-Age", value: "86400" },
    ] }];
  },
};

export default nextConfig;
