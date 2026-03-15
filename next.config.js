/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/documents/:path*',
        destination: 'http://docs:80/documents/:path*',
      },
    ]
  },
}

module.exports = nextConfig
