import {Metadata} from "next";
import {redirect} from "next/navigation";

// 設定頁面的 SEO 資訊（取代原本的 Head）
export const metadata: Metadata = {
    title: "RTbus 快桃客運",
    description: "RTbus 快桃客運",
    openGraph: {
        title: "RTbus 快桃客運",
        description: "RTbus 快桃客運",
        type: "website",
        url: "https://tybusstation.github.io/rtbus",
        images: [
            {
                url: "https://raw.githubusercontent.com/TYBusStation/tybusstation.github.io/refs/heads/main/public/rtbus.png",
                width: 1219,
                height: 240,
                alt: "RTbus 快桃客運",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "RTbus 快桃客運",
        description: "RTbus 快桃客運",
        images: ["https://raw.githubusercontent.com/TYBusStation/tybusstation.github.io/refs/heads/main/public/rtbus.png"],
    },
};

export default function RtbusPage() {
    // 使用 Next.js 的 redirect 進行伺服器端跳轉
    // 這比 meta http-equiv="refresh" 更快且更專業
    redirect("https://youtu.be/dQw4w9WgXcQ");
}