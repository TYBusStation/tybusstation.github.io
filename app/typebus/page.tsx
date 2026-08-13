"use client";
import dynamic from 'next/dynamic';
import busData from './data.json';

const TypeBus = dynamic(() => import('./(components)/TypeBus'), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-black text-slate-400">載入中...</p>
        </div>
    )
});

export default function TypePage() {
    return (
        <main className="min-h-screen bg-slate-50">
            <TypeBus routeSets={busData as any}/>
        </main>
    );
}