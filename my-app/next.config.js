/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.externals.push({
      'canvas': 'canvas',
    })
    return config
  },
}

module.exports = nextConfig