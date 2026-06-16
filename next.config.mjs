/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/Investment-Portfolios' : '',
  assetPrefix: isProd ? '/Investment-Portfolios/' : '',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
