/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static file serving for Three.js models and textures
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(gltf|glb|bin)$/,
      use: ['file-loader'],
    });
    return config;
  },
}

module.exports = nextConfig