"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {ChevronLeft, Menu, RotateCcw, Search, Trophy, X} from 'lucide-react';
// Layout Wrapper
import dynamic from 'next/dynamic';

interface BusStation {
    order: number;
    name: string;
    name_en: string;
    lat: number;
    lon: number;
}

interface BusRoute {
    id: string;
    name: string;
    path: { go: string; back: string };
    stations: { go: BusStation[]; back: BusStation[] };
}

interface RouteSet {
    name: string;
    routes: BusRoute[];
}

interface GameStation {
    name: string;
    nameEn: string;
    coords: [number, number][];
    routes: string[];
}

interface ProgressRecord {
    best: { accuracy: number; seconds: number; grade: string; } | null;
    current: { foundNames: string[]; seconds: number; isSettled: boolean; } | null;
}

const getGrade = (accuracy: number) => {
    if (accuracy <= 0) return '--';
    const groups = [
        {symbol: 'ㄦ', step: 0.9}, {symbol: 'ㄋ', step: 3.25},
        {symbol: 'ㄊ', step: 3.25}, {symbol: 'ㄉ', step: 3.25},
        {symbol: 'ㄈ', step: 3.25}, {symbol: 'ㄇ', step: 3.25},
        {symbol: 'ㄆ', step: 3.25}, {symbol: 'ㄅ', step: 3.25},
    ];
    const suffixes = ['--', '-', '', '+', '++'];
    let cumulative = 0;
    for (const group of groups) {
        for (const suff of suffixes) {
            cumulative += group.step;
            if (accuracy <= cumulative) return group.symbol + suff;
        }
    }
    return 'ㄅ++';
};

const normalizeName = (name: string) => name ? name.toLowerCase().replace(/[台臺]/g, '台').replace(/[（【［\[]/g, '(').replace(/[）】］\]]/g, ')').trim() : "";

const parseWkt = (wkt: string): [number, number][] => {
    const match = wkt?.match(/\(([^)]+)\)/);
    return match ? match[1].split(',').map(coord => {
        const [lon, lat] = coord.trim().split(/\s+/).map(Number);
        return [lat, lon];
    }) : [];
};

const getRouteColor = (index: number, total: number) => `hsl(${(index * 360) / (total || 1)}, 70%, 45%)`;

const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function MapController({targetPos, bounds}: { targetPos: [number, number] | null; bounds: L.LatLngBounds | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) map.fitBounds(bounds, {padding: [40, 40]});
    }, [bounds, map]);
    useEffect(() => {
        if (targetPos) map.setView(targetPos, 17, {animate: true});
    }, [targetPos, map]);
    return null;
}

function OptimizedStationsLayer({stations, foundNames, isSettled, currentSet}: any) {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());
    const [bounds, setBounds] = useState(map.getBounds());

    // 定義站名顯示的縮放門檻 (例如 15 以上才顯示文字)
    const LABEL_THRESHOLD_ZOOM = 15;

    useMapEvents({
        zoomend: () => setZoom(map.getZoom()),
        moveend: () => setBounds(map.getBounds()),
    });

    const scale = useMemo(() => Math.max(0.3, Math.min(2.5, Math.pow(1.2, zoom - 14))), [zoom]);

    const visibleStations = useMemo(() => {
        const isMobile = window.innerWidth < 768;
        return stations.filter((s: any, idx: number) => {
            const pos = s.coords[0];
            if (!bounds.contains(L.latLng(pos[0], pos[1]))) return false;

            const isFound = foundNames.has(normalizeName(s.name));
            if (!isFound && !isSettled) {
                if (isMobile) {
                    if (zoom < 13) return idx % 10 === 0;
                    if (zoom < 15) return idx % 4 === 0;
                } else {
                    if (zoom < 12) return idx % 8 === 0;
                }
            }
            return true;
        }).flatMap((s: any) => {
            const isFound = foundNames.has(normalizeName(s.name));
            const showCorrect = isSettled && !isFound;
            return s.coords.map((pos: any, pIdx: number) => ({
                ...s, pos, isFound, showCorrect, key: `${s.name}-${pIdx}`
            }));
        });
    }, [stations, foundNames, isSettled, zoom, bounds]);

    return (
        <>
            {visibleStations.map((s: any) => (
                <CircleMarker
                    key={s.key}
                    center={s.pos}
                    radius={(s.isFound || s.showCorrect ? 6 : 4) * scale}
                    pathOptions={{
                        fillColor: s.isFound ? '#4f46e5' : (s.showCorrect ? '#f43f5e' : '#cbd5e1'),
                        fillOpacity: (s.isFound || s.showCorrect) ? 1 : 0.5,
                        color: '#fff',
                        weight: Math.max(1, 2 * scale),
                    }}
                >
                    {/* 修改處：加上 zoom >= LABEL_THRESHOLD_ZOOM 判斷 */}
                    {(s.isFound || s.showCorrect) && zoom >= LABEL_THRESHOLD_ZOOM && (
                        <Tooltip permanent direction="right" offset={[10 * scale, 0]} className="minimal-label">
                            <span className={`station-text ${s.showCorrect ? 'text-rose-500' : 'text-indigo-900'}`}
                                  style={{fontSize: `${Math.max(8, 12 * scale)}px`}}>
                                {s.name}
                            </span>
                        </Tooltip>
                    )}
                    <Popup>
                        <div className="p-1">
                            <div className="font-black text-sm">{s.isFound || isSettled ? s.name : '???'}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {s.routes.map((rn: string) => (
                                    <span key={rn}
                                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-600 text-white font-bold">
                                        {rn}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </>
    );
}

export default function TypeBus({routeSets: initialSets}: { routeSets: RouteSet[] }) {
    const [activeSetIdx, setActiveSetIdx] = useState<number | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [foundNames, setFoundNames] = useState<Set<string>>(new Set());
    const [seconds, setSeconds] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'no' | 'info' } | null>(null);
    const [isSettled, setIsSettled] = useState(false);
    const [history, setHistory] = useState<Record<string, ProgressRecord>>({});
    const [lastFoundPos, setLastFoundPos] = useState<[number, number] | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('typebus_v9_history');
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    const currentSet = activeSetIdx !== null ? initialSets[activeSetIdx] : null;

    const gameData = useMemo(() => {
        if (!currentSet) return {stations: [], totalCount: 0, bounds: null};
        const nameMap: Record<string, GameStation> = {};
        currentSet.routes.forEach(route => {
            [...(route.stations?.go || []), ...(route.stations?.back || [])].forEach(s => {
                const norm = normalizeName(s.name);
                if (!nameMap[norm]) {
                    nameMap[norm] = {name: s.name, nameEn: s.name_en, coords: [[s.lat, s.lon]], routes: [route.name]};
                } else {
                    if (!nameMap[norm].coords.some(c => Math.abs(c[0] - s.lat) < 0.00003 && Math.abs(c[1] - s.lon) < 0.00003)) {
                        nameMap[norm].coords.push([s.lat, s.lon]);
                    }
                    if (!nameMap[norm].routes.includes(route.name)) nameMap[norm].routes.push(route.name);
                }
            });
        });
        const stations = Object.values(nameMap);
        const allCoords = stations.flatMap(s => s.coords);
        return {stations, totalCount: stations.length, bounds: allCoords.length ? L.latLngBounds(allCoords) : null};
    }, [currentSet]);

    const accuracy = useMemo(() => {
        if (!gameData.totalCount) return 0;
        return Number(((foundNames.size / gameData.totalCount) * 100).toFixed(1));
    }, [foundNames.size, gameData.totalCount]);

    useEffect(() => {
        if (gameStarted && !isSettled && foundNames.size > 0) {
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameStarted, isSettled, foundNames.size]);

    const autoSave = useCallback((settle: boolean) => {
        if (!currentSet) return;
        const key = currentSet.name;
        const currentHistory = JSON.parse(localStorage.getItem('typebus_v9_history') || '{}');
        const newCurrent = {foundNames: Array.from(foundNames), seconds, isSettled: settle};
        let newBest = currentHistory[key]?.best || null;
        if (settle) {
            if (!newBest || accuracy > newBest.accuracy || (accuracy === newBest.accuracy && seconds < newBest.seconds)) {
                newBest = {accuracy, seconds, grade: getGrade(accuracy)};
            }
        }
        const updated = {...currentHistory, [key]: {best: newBest, current: newCurrent}};
        setHistory(updated);
        localStorage.setItem('typebus_v9_history', JSON.stringify(updated));
        if (settle) setIsSettled(true);
    }, [currentSet, foundNames, seconds, accuracy]);

    useEffect(() => {
        if (gameStarted && !isSettled && foundNames.size > 0) autoSave(false);
    }, [foundNames.size, autoSave, gameStarted, isSettled]);

    const startGame = (idx: number, resume: boolean) => {
        const set = initialSets[idx];
        const rec = history[set.name];
        setInputValue("");
        setFeedback(null);
        setLastFoundPos(null);
        if (resume && rec?.current && !rec.current.isSettled) {
            setFoundNames(new Set(rec.current.foundNames));
            setSeconds(rec.current.seconds);
        } else {
            setFoundNames(new Set());
            setSeconds(0);
        }
        setActiveSetIdx(idx);
        setIsSettled(false);
        setGameStarted(true);
        if (window.innerWidth < 768) setShowSidebar(false);
    };

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        const term = normalizeName(inputValue);
        if (!term) return;
        const matched = gameData.stations.find(s => normalizeName(s.name) === term);
        if (!matched) {
            setFeedback({msg: "沒有這站欸...", type: 'no'});
        } else if (foundNames.has(normalizeName(matched.name))) {
            setFeedback({msg: "已經輸入過了...", type: 'info'});
            setInputValue("");
        } else {
            setFoundNames(prev => new Set(prev).add(normalizeName(matched.name)));
            setLastFoundPos(matched.coords[0]);
            setFeedback({msg: `答對啦！ ${matched.name}`, type: 'ok'});
            setInputValue("");
        }
    };

    if (!gameStarted) return (
        /* 將 min-h-screen 確保內容至少撐滿螢幕，並移除 overflow-y-auto 讓最外層捲動 */
        <div className="min-h-screen bg-slate-50 p-4 md:p-12 flex flex-col items-center font-sans">
            <div className="max-w-6xl w-full">
                <header className="mb-8 md:mb-16">
                    <h1 className="text-6xl md:text-9xl font-black text-slate-900 italic tracking-tighter">TypeBus</h1>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {initialSets.map((set, idx) => {
                        const rec = history[set.name];
                        const hasCurrent = rec?.current && !rec.current.isSettled && (rec.current.foundNames.length > 0 || rec.current.seconds > 0);
                        const currentAcc = rec?.current && !rec.current.isSettled
                            ? ((rec.current.foundNames.length / (set.routes.reduce((acc, r) => acc + (r.stations.go.length + r.stations.back.length), 0) / 2 || 1)) * 100).toFixed(1)
                            : "0.0";
                        return (
                            <div key={idx}
                                 className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col border-2 border-transparent hover:border-indigo-600 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight pr-4">{set.name}</h3>
                                    {rec?.best && (
                                        <div
                                            className="bg-slate-900 text-white p-3 rounded-2xl text-center min-w-[75px] shadow-lg">
                                            <div className="text-xl font-black leading-none mb-1">{rec.best.grade}</div>
                                            <div
                                                className="text-[12px] font-mono mb-1">{rec.best.accuracy}%
                                            </div>
                                            <div
                                                className="text-[10px] font-bold border-t border-white/20 pt-1 mt-1">{formatTime(rec.best.seconds)}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-slate-400 text-sm font-bold mb-10">{set.routes.length} 條路線</div>
                                <div className="flex flex-col gap-3 mt-auto">
                                    {hasCurrent ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => startGame(idx, true)}
                                                    className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-black shadow-lg shadow-indigo-100 transition-colors uppercase tracking-widest">
                                                繼續挑戰 <span className="ml-2 text-xs opacity-70">{currentAcc}%</span>
                                            </button>
                                            <button onClick={() => {
                                                if (confirm("確定重開？")) startGame(idx, false);
                                            }}
                                                    className="w-14 h-14 rounded-2xl border-2 border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center transition-all">
                                                <RotateCcw size={20}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => startGame(idx, false)}
                                                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white text-lg font-black shadow-lg transition-colors uppercase tracking-widest">開始遊戲</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-white flex flex-col md:flex-row overflow-hidden font-sans text-slate-900">
            <div
                className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed md:relative md:translate-x-0 z-[2000] w-full md:w-[350px] h-full bg-white border-r flex flex-col transition-transform duration-300 shadow-2xl`}>
                <div className="p-4 md:p-5 border-b flex justify-between items-center bg-white">
                    <button onClick={() => {
                        autoSave(isSettled);
                        setGameStarted(false);
                        setActiveSetIdx(null);
                    }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={24}/></button>
                    <h2 className="font-black text-base md:text-lg truncate px-2">{currentSet?.name}</h2>
                    <button onClick={() => setShowSidebar(false)} className="md:hidden p-2 text-slate-600"><X
                        size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-8">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl">
                        <div
                            className="text-3xl font-mono font-black">{foundNames.size === 0 ? "00:00" : formatTime(seconds)}</div>
                        <div className="text-right">
                            <div className="text-xl font-black text-indigo-600">{getGrade(accuracy)}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">目前評分
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span
                                className="text-[10px] font-black text-slate-400 uppercase tracking-wider">完成進度</span>
                            <span
                                className="text-sm font-black">{foundNames.size} / {gameData.totalCount} ({accuracy}%)</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-500"
                                 style={{width: `${accuracy}%`}}/>
                        </div>
                    </div>
                    {isSettled ? (
                        <div
                            className="bg-slate-900 text-white p-10 rounded-[2.5rem] text-center shadow-2xl border-4 border-indigo-500/30">
                            <Trophy className="mx-auto mb-4 text-amber-400" size={48}/>
                            <div
                                className="text-6xl font-black mb-2 italic tracking-tighter text-indigo-400">{getGrade(accuracy)}</div>
                            <div className="h-px bg-white/10 w-12 mx-auto mb-4"/>
                            <div className="text-3xl font-black mb-1">{accuracy}%</div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">答對率</p>
                        </div>
                    ) : (
                        <div>
                            <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">包含路線</h4>
                            <div className="flex flex-wrap gap-2">
                                {currentSet?.routes.map((r, i) => (
                                    <div key={r.id}
                                         className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-600">
                                        <div className="w-2 h-2 rounded-full"
                                             style={{backgroundColor: getRouteColor(i, currentSet.routes.length)}}/>
                                        {r.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {!isSettled && (
                    <div className="p-4 md:p-6 bg-white border-t flex flex-col items-center">
                        <button onClick={() => {
                            if (confirm("確定交卷？")) autoSave(true);
                        }}
                                className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-lg transition-colors text-lg uppercase tracking-widest">交卷結算
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-1 relative bg-slate-100 h-full flex flex-col">
                <MapContainer center={[25.04, 121.51]} zoom={14} style={{height: '100%', width: '100%'}}
                              zoomControl={false} preferCanvas={true}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
                    <MapController targetPos={lastFoundPos} bounds={gameData.bounds}/>
                    {!showSidebar && (
                        <button onClick={() => setShowSidebar(true)}
                                className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-xl shadow-xl text-slate-700 border-2 border-slate-100 active:scale-95 transition-transform">
                            <Menu size={20}/></button>
                    )}
                    {currentSet?.routes.map((r, i) => {
                        const color = getRouteColor(i, currentSet.routes.length);
                        return <React.Fragment key={r.id}>
                            <Polyline positions={parseWkt(r.path.go)} color={color} weight={3} opacity={0.5}/>
                            <Polyline positions={parseWkt(r.path.back)} color={color} weight={3} opacity={0.5}/>
                        </React.Fragment>
                    })}
                    <OptimizedStationsLayer stations={gameData.stations} foundNames={foundNames} isSettled={isSettled}
                                            currentSet={currentSet}/>
                </MapContainer>
                {!isSettled && (
                    <div className="absolute bottom-6 md:bottom-8 left-0 right-0 px-4 z-[1500] pointer-events-none">
                        <div
                            className="max-w-md mx-auto pointer-events-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl p-1.5 md:p-2 border-2 border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                            <form onSubmit={handleGuess} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        size={16}/>
                                    <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                                           placeholder={foundNames.size === 0 ? "輸入第一站開始計時" : "輸入站名..."}
                                           className="w-full h-10 md:h-12 pl-10 md:pl-12 pr-4 bg-slate-50 rounded-xl md:rounded-2xl text-sm md:text-base font-bold text-slate-900 focus:outline-none"
                                           autoFocus/>
                                </div>
                                <button type="submit"
                                        className="px-4 md:px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-colors uppercase tracking-widest">確認
                                </button>
                            </form>
                            {feedback && <div
                                className={`mt-1 text-center text-[10px] font-black uppercase tracking-widest animate-pulse ${feedback.type === 'ok' ? 'text-green-600' : 'text-rose-600'}`}>{feedback.msg}</div>}
                        </div>
                    </div>
                )}
            </div>
            <style jsx global>{`
                .minimal-label {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    pointer-events: none;
                }

                .station-text {
                    font-weight: 900;
                    text-shadow: -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 0 4px rgba(0, 0, 0, 0.1);
                    white-space: nowrap;
                    letter-spacing: -0.5px;
                    transition: font-size 0.2s;
                }

                .leaflet-container {
                    font-family: inherit;
                    cursor: crosshair;
                }
            `}</style>
        </div>
    );
}

const TypeBusDynamic = dynamic(() => Promise.resolve(TypeBus), {ssr: false});

export function TypePage({routeSets}: { routeSets: RouteSet[] }) {
    return <main className="h-screen w-screen overflow-hidden bg-slate-50"><TypeBusDynamic routeSets={routeSets}/>
    </main>;
}