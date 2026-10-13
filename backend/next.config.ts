import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { hostname, protocol } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    remotePatterns.push({
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    });
  }
} catch {
  // Invalid URL in env — ignore; images from that host will need a rebuild once fixed.
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.188"],
  // The public site (Frontend) proxies /admin to this app so staff use one domain. Its own /_next paths would
  // clash with the site's, so this app serves its JS/CSS under /admin-static; the rewrite below makes that
  // prefix work when this app is opened directly too.
  assetPrefix: "/admin-static",
  async rewrites() {
    return { beforeFiles: [{ source: "/admin-static/:path*", destination: "/:path*" }], afterFiles: [], fallback: [] };
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
