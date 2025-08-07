/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Include font files from the public directory when tracing serverless functions.
  outputFileTracingIncludes: {
    '/api/generate-image': ['./public/fonts/**/*'],
  },
};

module.exports = nextConfig;