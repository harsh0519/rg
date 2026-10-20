import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* cacheComponents off: this is a mock-data app with client-side session/cart,
     so the strict prerender rules add friction without benefit. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
