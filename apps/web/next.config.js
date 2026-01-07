/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@td2u/shared-types',
    '@td2u/shared-utils',
    '@td2u/shared-srs',
    '@td2u/shared-validations',
  ],
};

module.exports = nextConfig;
