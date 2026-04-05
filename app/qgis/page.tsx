import Card from "@/app/(components)/Card";
import {items} from "@/data/data";

import {FaLink,} from "react-icons/fa";

export default function QgisPage() {
    return (
        <>
            <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto">
                <section className="flex flex-col items-center gap-5 justify-center my-10">

                    <div className="text-2xl font-semibold">
                        <a href="/public">QGIS 路線繪製教學</a>
                    </div>
                </section>

                <div className="w-full flex gap-2 my-2 flex-col items-center justify-center pb-2 lg:pb-10">
                    <Card
                        title={items.slides.title}
                        icon={<FaLink/>}
                        url={items.tracker.url}
                    />
                    <Card
                        title={items.polyline.title}
                        icon={<FaLink/>}
                        url={items.polyline.url}
                    />
                    <Card
                        title="成果範例"
                        icon={<FaLink/>}
                        url="https://youtube.com/shorts/wq9_Lq1jCKI"
                    />
                </div>
            </div>
        </>
    );
}
