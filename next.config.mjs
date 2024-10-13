/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: process.env.NODE_ENV === 'development',
    env: {
        MONGODB_URI: process.env.MONGODB_URI,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    },
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    },
  };
  
export default nextConfig;
