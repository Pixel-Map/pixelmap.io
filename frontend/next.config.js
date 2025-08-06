/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: [
      "api.pixelmap.dev",
      "api.pixelmap.io",
      "localhost",
      "pixelmap.art",
    ],
    minimumCacheTTL: 60,
  },
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};
