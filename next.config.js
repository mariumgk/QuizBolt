/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle canvas module for pdfjs-dist (optional peer dependency)
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    if (!isServer) {
      // Prevent bundling of onnxruntime-node in the client build
      config.externals = config.externals || [];
      config.externals.push({ "onnxruntime-node": "commonjs onnxruntime-node" });
    }

    if (isServer) {
      // Handle pdfkit font files for server-side PDF generation
      config.externals = config.externals || [];

      // Externalize fs module to prevent webpack from trying to bundle it
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };

      // Copy pdfkit font files
      config.module.rules.push({
        test: /\.afm$/,
        type: 'asset/resource',
      });
    }

    // Ignore canvas module (used by pdfjs-dist for Node.js, not needed in browser)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
    };

    return config;
  },
};

module.exports = nextConfig;
