// app/layout.tsx
import "./globals.css";
import Footer from "./(components)/Footer";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "桃園公車站 TYBusStation",
    description: "Made using Next.js",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="zh-TW">
        <body>
        <div
            className="min-h-screen bg-gradient-to-t from-zinc-800 to-zinc-900 p-2 md:flex items-center justify-center">
            {children}
        </div>
        <Footer/>
        </body>
        </html>
    );
}