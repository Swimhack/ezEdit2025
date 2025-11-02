import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client', 'basic-ftp'],
  turbopack: {}, // Enable Turbopack configuration
};

export default nextConfig;
