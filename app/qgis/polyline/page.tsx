"use client";

import React, {useState} from 'react';
import polyline from '@mapbox/polyline';

export default function PolylineToWKT() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');

    const handleConvert = () => {
        setError('');
        setOutput('');

        if (!input.trim()) {
            setError('請輸入內容');
            return;
        }

        try {
            const rawInput = input.trim();
            let combinedPoints: [number, number][] = []; // 儲存格式為 [緯度, 經度] 以符合 polyline 套件慣例

            // 嘗試解析 JSON
            if (rawInput.startsWith('[') || rawInput.startsWith('{')) {
                try {
                    const parsed = JSON.parse(rawInput);

                    // --- 新增：檢查是否為 [{X: 120, Y: 23}, ...] 格式 ---
                    if (Array.isArray(parsed) && parsed.length > 0 && 'X' in parsed[0] && 'Y' in parsed[0]) {
                        combinedPoints = parsed.map(item => [item.Y, item.X] as [number, number]);
                    }
                    // --- 原有邏輯：處理包含 li 屬性或純字串陣列的 Polyline ---
                    else if (Array.isArray(parsed)) {
                        const encodedSegments = parsed.map(item => item.li || item).filter(s => typeof s === 'string');
                        combinedPoints = decodePolylineSegments(encodedSegments);
                    } else if (parsed.li) {
                        combinedPoints = decodePolylineSegments([parsed.li]);
                    } else {
                        // 若是其他 JSON 格式但非座標陣列，嘗試當成單一 Polyline 字串
                        combinedPoints = decodePolylineSegments([rawInput]);
                    }
                } catch (e) {
                    // JSON 解析失敗，嘗試當成普通字串處理
                    combinedPoints = decodePolylineSegments([rawInput]);
                }
            } else {
                // 非 JSON 開頭，直接當成單一字串處理
                combinedPoints = decodePolylineSegments([rawInput]);
            }

            if (combinedPoints.length === 0) {
                setError('無有效座標點');
                return;
            }

            // 轉換為 WKT (WKT 標準通常是 經度 X + 緯度 Y)
            // 這裡 coord[1] 是 X (經度), coord[0] 是 Y (緯度)
            const wktContent = combinedPoints
                .map((coord) => `${coord[1]} ${coord[0]}`)
                .join(', ');

            setOutput(`LINESTRING (${wktContent})`);
        } catch (err) {
            setError('轉換失敗，請檢查輸入格式');
            console.error(err);
        }
    };

    // 輔助函式：處理 Polyline 解碼
    const decodePolylineSegments = (segments: string[]): [number, number][] => {
        let points: [number, number][] = [];
        segments.forEach((str) => {
            const sanitized = str.replace(/\\\\/g, '\\').replace(/\s+/g, '');
            const decoded = polyline.decode(sanitized);

            if (points.length > 0 && decoded.length > 0) {
                const lastPoint = points[points.length - 1];
                const firstPoint = decoded[0];

                // 銜接點去重
                if (lastPoint[0] === firstPoint[0] && lastPoint[1] === firstPoint[1]) {
                    points = [...points, ...decoded.slice(1)];
                } else {
                    points = [...points, ...decoded];
                }
            } else {
                points = [...decoded];
            }
        });
        return points;
    };

    const copyToClipboard = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        alert('已將 WKT 複製到剪貼簿，可直接於 QGIS 貼上。');
    };

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#f4f4f7',
            padding: '20px',
            boxSizing: 'border-box',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                maxWidth: '850px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 2px 15px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    marginBottom: '20px',
                    color: '#1a1a1a',
                    textAlign: 'center'
                }}>Encoded Polyline / 特定 JSON 格式 轉 WKT</h1>

                <div style={{marginBottom: '15px'}}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#555'
                    }}>
                        輸入內容 (Encoded Polyline 或特定 JSON 格式)
                    </label>
                    <textarea
                        style={{
                            width: '100%',
                            height: '200px',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            wordBreak: 'break-all',
                            whiteSpace: 'pre-wrap',
                            display: 'block',
                            outline: 'none',
                            lineHeight: '1.4'
                        }}
                        placeholder='在此貼入你的 Encoded Polyline 或特定 JSON 格式...'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleConvert}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginBottom: '20px'
                    }}
                >
                    轉換為 WKT
                </button>

                {error && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#fff1f2',
                        color: '#e11d48',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        border: '1px solid #fda4af'
                    }}>
                        {error}
                    </div>
                )}

                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <label style={{fontSize: '14px', fontWeight: 'bold', color: '#555'}}>WKT 結果</label>
                        <button
                            onClick={copyToClipboard}
                            style={{
                                padding: '12px 45px',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                        >
                            複製 WKT 結果 (可直接於 QGIS 貼上)
                        </button>
                    </div>
                    <textarea
                        readOnly
                        style={{
                            width: '100%',
                            height: '250px',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box',
                            wordBreak: 'break-all',
                            display: 'block',
                            lineHeight: '1.4',
                            color: '#333'
                        }}
                        value={output}
                    />
                </div>
            </div>
        </div>
    );
}