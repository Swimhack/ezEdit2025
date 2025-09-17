/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['sctzykgcfkhadowyqcrj.supabase.co'],
  },
  output: 'standalone',
  generateEtags: false,
  poweredByHeader: false,
}

module.exports = nextConfig