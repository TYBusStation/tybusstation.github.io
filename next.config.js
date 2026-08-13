/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. 移除 experimental.appDir，因為在現代 Next.js 中 App Router 是預設開啟的，
    // 留著它會導致無效選項錯誤。

    // 2. 解決 Turbopack 與 Webpack 設定衝突
    // 當你定義了 webpack 函式，Next.js 的新引擎 Turbopack 會報錯。
    // 加入這個空的 turbopack 設定物件可以告訴 Next.js 忽略兩者的衝突。
    turbopack: {},

    webpack: (config, {isServer}) => {
        if (!isServer) {
            // 避免在客戶端打包時尋找 Node.js 內建模組
            // 這是為了相容某些舊版地圖或 GIS 套件
            config.resolve.fallback = {
                ...config.resolve.fallback,
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
                pathname: '/engageintellect/**', // 請確保這是你正確的 GitHub 使用者名稱路徑
            },
        ],
    },
};

module.exports = nextConfig;