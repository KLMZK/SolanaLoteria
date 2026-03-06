const nextConfig: any = {
  serverExternalPackages: ["ws"],
  experimental: {
    allowedDevOrigins: [
      "localhost:3000",
      "loca.lt",
      "192.168.0.225:3000",
      "192.168.68.78:3000",
      "192.168.68.78"
    ],
  },
};

export default nextConfig;
