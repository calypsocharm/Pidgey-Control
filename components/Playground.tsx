
import React, { useState } from 'react';
import { Image as ImageIcon, Move, Palette, Download, RefreshCw } from 'lucide-react';
import { MOCK_ASSETS, MOCK_STAMPS } from '../constants';
import { AssetType } from '../types';

export const Playground = () => {
    const backgrounds = MOCK_ASSETS.filter(a => a.type === AssetType.CARD_TEMPLATE);
    const stamps = MOCK_STAMPS;

    const [bg, setBg] = useState(backgrounds[0]?.url || 'https://via.placeholder.com/600x800');
    const [placedStamps, setPlacedStamps] = useState<{id: string, url: string, x: number, y: number}[]>([]);

    const addStamp = (url: string) => {
        setPlacedStamps([...placedStamps, {
            id: Date.now().toString(),
            url,
            x: Math.random() * 40 + 30, // Random center-ish position
            y: Math.random() * 40 + 30
        }]);
    };

    const clearCanvas = () => {
        setPlacedStamps([]);
    };

    return (
        <div className="h-[calc(100vh-10rem)] flex gap-6">
            {/* Left Panel: Tools */}
            <div className="w-80 flex flex-col gap-6">
                <div className="bg-pidgey-panel border border-pidgey-border rounded-xl flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-pidgey-border bg-pidgey-dark">
                        <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                            <ImageIcon size={16} /> Backgrounds
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
                        {backgrounds.map((b, i) => (
                            <div 
                                key={i} 
                                onClick={() => setBg(b.url)}
                                className={`aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${bg === b.url ? 'border-pidgey-accent ring-2 ring-pidgey-accent/20' : 'border-transparent hover:border-pidgey-muted'}`}
                            >
                                <img src={b.url} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-pidgey-panel border border-pidgey-border rounded-xl flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-pidgey-border bg-pidgey-dark">
                        <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                            <Palette size={16} /> Stamp Tray
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-2">
                        {stamps.map((s, i) => (
                            <div 
                                key={i} 
                                onClick={() => addStamp(s.art_path)}
                                className="aspect-square bg-pidgey-dark rounded-lg p-2 cursor-pointer border border-pidgey-border hover:border-pidgey-accent hover:bg-pidgey-accent/10 transition-all flex items-center justify-center"
                            >
                                <img src={s.art_path} className="max-w-full max-h-full object-contain" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Center: Canvas */}
            <div className="flex-1 bg-pidgey-dark border border-pidgey-border rounded-xl flex items-center justify-center relative overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="relative h-[80%] aspect-[3/4] bg-white shadow-2xl rounded overflow-hidden transition-all duration-300">
                    <img src={bg} className="w-full h-full object-cover" />
                    
                    {/* Placed Stamps Layer */}
                    {placedStamps.map((s, i) => (
                        <div 
                            key={s.id}
                            className="absolute w-24 h-24 cursor-move hover:ring-2 ring-pidgey-accent rounded"
                            style={{ left: `${s.x}%`, top: `${s.y}%` }}
                            draggable
                            onDragEnd={(e) => {
                                // Very basic drag simulation
                                const newStamps = [...placedStamps];
                                newStamps[i].x = Math.max(0, Math.min(90, (e.clientX / window.innerWidth) * 100)); // Mock logic
                                newStamps[i].y = Math.max(0, Math.min(90, (e.clientY / window.innerHeight) * 100));
                                setPlacedStamps(newStamps);
                            }}
                        >
                            <img src={s.url} className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                    ))}
                </div>

                {/* Canvas Controls */}
                <div className="absolute bottom-6 flex gap-2">
                    <button onClick={clearCanvas} className="px-4 py-2 bg-pidgey-panel border border-pidgey-border rounded-lg text-sm font-bold hover:text-white flex items-center gap-2">
                        <RefreshCw size={16} /> Reset
                    </button>
                    <button className="px-4 py-2 bg-pidgey-accent text-pidgey-dark rounded-lg text-sm font-bold hover:bg-teal-300 flex items-center gap-2">
                        <Download size={16} /> Save Mockup
                    </button>
                </div>
            </div>

            {/* Right: Info */}
            <div className="w-64 bg-pidgey-panel border border-pidgey-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-2">Visual Playground</h2>
                <p className="text-sm text-pidgey-muted mb-6">Drag and drop stamps to test visual compatibility with card backgrounds.</p>
                
                <div className="space-y-4">
                    <div className="p-3 bg-pidgey-dark rounded-lg border border-pidgey-border">
                        <span className="text-xs font-bold text-pidgey-muted uppercase block mb-1">Active Stamps</span>
                        <span className="text-xl font-bold">{placedStamps.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
