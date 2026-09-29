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
  images: {
    remotePatterns,
  },
};

export default nextConfig;
