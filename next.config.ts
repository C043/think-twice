import type { NextConfig } from "next";

/**
 * Hosts allowed to pull `/_next/*` dev resources from another origin. Next
 * blocks these by default, which silently leaves the page un-hydrated when the
 * dev server is reached over a LAN or Tailscale address instead of localhost.
 *
 * Development only — the setting has no effect on a production build.
 * Comma-separated, e.g. ALLOWED_DEV_ORIGINS="100.98.59.61,*.ts.net".
 */
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
