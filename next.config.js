/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },

    webpack: (config, {isServer}) => {
        if (!isServer) {
            // 避免在客戶端打包時尋找 Node.js 內建模組
            config.resolve.fallback = {
                fs: false,
                path: false,
                crypto: false,
            };
        }
        return config;
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
                port: '',
                pathname: '/engageintellect/**',
            },
        ],
    },

}

module.exports = nextConfig
