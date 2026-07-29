/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/api/erp/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
