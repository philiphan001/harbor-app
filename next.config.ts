import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdf-to-img", "pdfjs-dist", "@napi-rs/canvas", "sharp"],
};

export default nextConfig;
