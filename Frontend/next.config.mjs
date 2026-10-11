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

const nextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
