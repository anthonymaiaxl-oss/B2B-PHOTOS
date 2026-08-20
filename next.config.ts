import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp roda dentro da rota /api/photo — não pode ser empacotado pelo bundler.
  serverExternalPackages: ["sharp"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        // A área da organização nunca deve ser indexada nem ficar em cache.
        source: "/admin",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
