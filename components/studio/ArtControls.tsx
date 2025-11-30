
import React from 'react';
import { Scaling, ZoomIn, Move } from 'lucide-react';
import { ArtConfig } from '../../types';

interface ArtControlsProps {
    config: ArtConfig;
    onChange: (config: ArtConfig) => void;
}

export const ArtControls: React.FC<ArtControlsProps> = ({ config, onChange }) => {
    return (
        <div>
            <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Scaling size={14} className="text-pidgey-accent"/> Art Adjustment</h3>
            
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-bold text-pidgey-muted uppercase flex items-center gap-1"><ZoomIn size={10}/> Scale</label>
                        <span className="text-[9px] font-mono text-white">{config.scale.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" min="0.5" max="2.0" step="0.1"
                        value={config.scale} 
                        onChange={e => onChange({...config, scale: parseFloat(e.target.value)})} 
                        className="w-full h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 flex items-center gap-1"><Move size={10}/> Pan X</label>
                        <input 
                            type="number" 
                            value={config.x} 
                            onChange={e => onChange({...config, x: parseInt(e.target.value)})} 
                            className="w-full bg-pidgey-dark border border-pidgey-border rounded p-1.5 text-xs text-white text-center"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 flex items-center gap-1"><Move size={10} className="rotate-90"/> Pan Y</label>
                            <input 
                            type="number" 
                            value={config.y} 
                            onChange={e => onChange({...config, y: parseInt(e.target.value)})} 
                            className="w-full bg-pidgey-dark border border-pidgey-border rounded p-1.5 text-xs text-white text-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
