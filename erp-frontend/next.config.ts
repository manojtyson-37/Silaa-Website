import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // Server-side proxy eliminates cross-origin CORS for all client DELETE/PATCH/POST calls.
    // Browser hits /api/erp/... → Next.js proxies to the FastAPI backend → no CORS preflight needed.
    // ERP_BACKEND_URL must be the full prefix including /api/erp, no trailing slash.
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
