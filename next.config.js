/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // defaults to TRUE, unless API Keys are set at build time; this flag is used by the UI
    HAS_SERVER_KEY_OPENAI: !!process.env.OPENAI_API_KEY,
    HAS_SERVER_KEY_ELEVENLABS: !!process.env.ELEVENLABS_API_KEY,
    HAS_SERVER_KEY_PRODIA: !!process.env.PRODIA_API_KEY,
    HAS_SERVER_KEYS_GOOGLE_CSE: !!process.env.GOOGLE_CLOUD_API_KEY && !!process.env.GOOGLE_CSE_ID,
  },
  webpack(config, { isServer, dev }) {
    // @mui/joy: anything material gets redirected to Joy
    config.resolve.alias['@mui/material'] = '@mui/joy';

    // @dqbd/tiktoken: enable asynchronous WebAssembly
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
      // https://github.com/vercel/next.js/issues/43382#issuecomment-1408989720
      topLevelAwait: true,
    };

    return config;
  },
};

module.exports = nextConfig;
