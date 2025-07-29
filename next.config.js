/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are now stable in Next.js 14
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.rybysemin.cz' }],
        destination: 'https://rybysemin.cz/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig 