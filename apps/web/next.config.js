/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,

  outputFileTracingRoot: path.join(__dirname, "../.."),

  transpilePackages: ["@nova-ai/shared"],

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;