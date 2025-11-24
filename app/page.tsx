import Avatar from "./(components)/Avatar";
import Card from "./(components)/Card";

import {FaGithub, FaInstagram, FaLink,} from "react-icons/fa";

import {items, tagline} from "../data/data";

export default function Home() {
    return (
        <>
            <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto">
                <section className="flex flex-col items-center gap-5 justify-center my-10">
                    <Avatar/>
                    <div className="text-2xl font-semibold">
                        <a href="/">桃園公車站 TYBusStation</a>
                    </div>

                    <div className="text-zinc-500 flex justify-between gap-5">
                        {tagline.map((item, index) => (
                            <div
                                className="text-zinc-500 text-sm text-center font-thin"
                                key={index}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <div className="w-full flex gap-2 my-2 flex-col items-center justify-center pb-2 lg:pb-10">
                    <Card
                        title={items.tracker.title}
                        icon={<FaLink/>}
                        url={items.tracker.url}
                    />
                    <Card
                        title={items.mvdis.title}
                        icon={<FaLink/>}
                        url={items.mvdis.url}
                    />
                    <Card
                        title={items.taichung_bus.title}
                        icon={<FaLink/>}
                        url={items.taichung_bus.url}
                    />
                    <Card
                        title={items.github.title}
                        icon={<FaGithub/>}
                        url={items.github.url}
                    />
                    <Card
                        title={items.instagram.title}
                        icon={<FaInstagram/>}
                        url={items.instagram.url}
                    />
                    <Card
                        title={items.owner.title}
                        icon={<FaLink/>}
                        url={items.owner.url}
                    />
                    <Card
                        title={items.exhibition.title}
                        icon={<FaLink/>}
                        url={items.exhibition.url}
                    />
                </div>
            </div>
        </>
    );
}
