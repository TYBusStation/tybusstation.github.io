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
            let encodedSegments: string[] = [];
            const rawInput = input.trim();

            if (rawInput.startsWith('[') || rawInput.startsWith('{')) {
                try {
                    const parsed = JSON.parse(rawInput);
                    if (Array.isArray(parsed)) {
                        encodedSegments = parsed.map(item => item.li || item).filter(s => typeof s === 'string');
                    } else if (parsed.li) {
                        encodedSegments = [parsed.li];
                    } else {
                        encodedSegments = [rawInput];
                    }
                } catch (e) {
                    encodedSegments = [rawInput];
                }
            } else {
                encodedSegments = [rawInput];
            }

            let combinedPoints: [number, number][] = [];

            encodedSegments.forEach((str) => {
                const sanitized = str.replace(/\\\\/g, '\\').replace(/\s+/g, '');
                const decoded = polyline.decode(sanitized);

                if (combinedPoints.length > 0 && decoded.length > 0) {
                    const lastPoint = combinedPoints[combinedPoints.length - 1];
                    const firstPoint = decoded[0];

                    if (lastPoint[0] === firstPoint[0] && lastPoint[1] === firstPoint[1]) {
                        combinedPoints = [...combinedPoints, ...decoded.slice(1)];
                    } else {
                        combinedPoints = [...combinedPoints, ...decoded];
                    }
                } else {
                    combinedPoints = [...decoded];
                }
            });

            if (combinedPoints.length === 0) {
                setError('無有效座標點');
                return;
            }

            const wktContent = combinedPoints
                .map((coord) => `${coord[1]} ${coord[0]}`)
                .join(', ');

            setOutput(`LINESTRING (${wktContent})`);
        } catch (err) {
            setError('轉換失敗，請檢查輸入格式');
        }
    };

    const copyToClipboard = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        alert('已複製到剪貼簿');
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
                }}>Polyline 轉 WKT</h1>

                <div style={{marginBottom: '15px'}}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#555'
                    }}>
                        Encoded Polyline (單一字串或 JSON 陣列)
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
                        placeholder='請在此貼入內容...'
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
                        <label style={{fontSize: '14px', fontWeight: 'bold', color: '#555'}}>WKT</label>
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
                            複製 WKT
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