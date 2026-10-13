/** @type {import('next').NextConfig} */
const remotePatterns = [
  { protocol: 'https', hostname: 'images.unsplash.com' },
];

// Property photos live in the project's Supabase storage; allow whichever project the env points at.
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { hostname, protocol } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    remotePatterns.push({
      protocol: protocol.replace(':', ''),
      hostname,
      pathname: '/storage/v1/**',
    });
  }
} catch {
  // Invalid URL in env: ignore.
}

// The admin CMS is a separate app (../backend). Proxy /admin to it so staff open <site>/admin on the same domain.
// ADMIN_ORIGIN is the admin app's own address (e.g. https://parmar-admin.vercel.app). In `next dev` it defaults to
// http://localhost:3001; in production nothing is proxied until the variable is set.
const adminOrigin = process.env.ADMIN_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

const nextConfig = {
  images: { remotePatterns },
  async rewrites() {
    if (!adminOrigin) return [];
    return [
      { source: '/admin', destination: `${adminOrigin}/admin` },
      { source: '/admin/:path*', destination: `${adminOrigin}/admin/:path*` },
      // The admin app's JS/CSS (its assetPrefix), kept off the site's own /_next paths.
      { source: '/admin-static/:path*', destination: `${adminOrigin}/admin-static/:path*` },
    ];
  },
};

export default nextConfig;
