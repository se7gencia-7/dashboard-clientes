import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/.prisma/client/libquery_engine-rhel*",
      "./node_modules/.prisma/client/query_engine-*",
      "./node_modules/@prisma/client/runtime/**",
    ],
  },
};

export default nextConfig;
