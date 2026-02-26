import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Proxy API requests to backend (avoids CORS, fixes "Network Error" when backend is on different origin)
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "vormex.b-cdn.net",
      },
    ],
  },
};

export default nextConfig;
