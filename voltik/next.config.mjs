/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Keep the mongodb driver out of the webpack bundle — it needs Node runtime.
  serverExternalPackages: ['mongodb']
};

export default nextConfig;
