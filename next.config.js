/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true
  },
  distDir: '.next',
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  images: {
    domains: ['actcast-prd-thing-storage.s3.ap-northeast-1.amazonaws.com']
  }
}

module.exports = nextConfig 