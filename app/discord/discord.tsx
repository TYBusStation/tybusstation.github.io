import {redirect} from "next/navigation";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "公車交流群",
    description: "公車交流群",
    openGraph: {
        title: "公車交流群",
        description: "公車交流群",
        images: ["https://raw.githubusercontent.com/TYBusStation/tybusstation.github.io/refs/heads/main/public/avatar.png"],
        url: "https://tybusstation.github.io/discord",
    },
    twitter: {
        card: "summary_large_image",
        title: "公車交流群",
        images: ["https://raw.githubusercontent.com/TYBusStation/tybusstation.github.io/refs/heads/main/public/avatar.png"],
    }
};

export default function DiscordPage() {
    // 伺服器端直接跳轉
    redirect("https://discord.gg/nH7E28CVaF");
}