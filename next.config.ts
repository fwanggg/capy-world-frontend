import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/chat/:path*", destination: "/api/chat/:path*" },
      { source: "/clones/:path*", destination: "/api/clones/:path*" },
      { source: "/studyrooms/:path*", destination: "/api/studyrooms/:path*" },
      { source: "/user/:path*", destination: "/api/user/:path*" },
      { source: "/waitlist/:path*", destination: "/api/waitlist/:path*" },
      { source: "/test", destination: "/api/test" },
    ];
  },
};

export default nextConfig;
