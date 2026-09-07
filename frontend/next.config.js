const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    unoptimized: true,
    domains: [
      "api.pixelmap.dev",
      "api.pixelmap.io",
      "localhost",
      "pixelmap.art",
    ],
    minimumCacheTTL: 60,
  },
  reactStrictMode: true,
};
