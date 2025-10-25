/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"]
    }
  },
  eslint: {
    dirs: ["src"]
  },
  typescript: {
    tsconfigPath: "./tsconfig.json"
  }
};

export default nextConfig;
