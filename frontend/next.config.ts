import type { NextConfig } from "next";

// Derive the API hostname + port from NEXT_PUBLIC_API_URL so Next.js <Image>
// can load photos served by the Laravel backend (e.g. http://localhost:8000/storage/…)
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
let apiHostname = 'localhost';
let apiPort = '';
try {
  const parsed = new URL(apiUrl);
  apiHostname = parsed.hostname;
  apiPort = parsed.port; // e.g. "8000" — empty string for default ports 80/443
} catch { /* keep defaults */ }

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost',  port: '' },
      { protocol: 'http',  hostname: '127.0.0.1',  port: '' },
      { protocol: 'http',  hostname: apiHostname, port: apiPort },
      { protocol: 'https', hostname: apiHostname, port: apiPort },
      { protocol: 'https', hostname: 'imagedelivery.net' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
