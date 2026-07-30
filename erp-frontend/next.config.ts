import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Server-side proxy eliminates cross-origin CORS for all client DELETE/PATCH/POST calls.
    // Browser hits /api/erp/... → Next.js proxies to the FastAPI backend → no CORS preflight needed.
    const backend = process.env.ERP_BACKEND_URL || "https://silaa-website.vercel.app/api/erp";
    return [
      {
        source: "/api/erp/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },
};

export default nextConfig;
