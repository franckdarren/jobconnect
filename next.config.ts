import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Largest upload is the CV (5 MB). Avatars/logos/job-images cap at 2 MB.
      // A 6 MB ceiling leaves headroom for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
