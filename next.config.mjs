/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Inert with a custom loader (loader:"custom" bypasses /_next/image
    // entirely) — left as documentation of which remote hosts are expected,
    // in case the custom loader is ever removed and the built-in one returns.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
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
