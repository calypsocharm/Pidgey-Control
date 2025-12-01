
import React from 'react';
import { MonitorPlay, X, Sparkles, Zap, Box, Sun, Disc } from 'lucide-react';
import { EffectConfig } from '../../types';

interface EffectsEditorProps {
    config: EffectConfig;
    onChange: (config: EffectConfig) => void;
}

export const EffectsEditor: React.FC<EffectsEditorProps> = ({ config, onChange }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><MonitorPlay size={14} className="text-green-400"/> Special FX</h3>
                
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'none', label: 'None', icon: X },
                        { id: 'foil', label: 'Foil', icon: Disc },
                        { id: 'holo_foil', label: 'Holo Foil', icon: Disc },
                        { id: 'glowing', label: 'Glowing', icon: Sun },
                        { id: 'sparkles', label: 'Sparkles', icon: Sparkles },
                        { id: 'shimmer', label: 'Shimmer', icon: Sparkles },
                        { id: 'glitch', label: 'Glitch', icon: Zap },
                        { id: '3d', label: '3D Pop', icon: Box },
                    ].map((fx) => (
                        <button
                            key={fx.id}
                            onClick={() => onChange({ ...config, type: fx.id as any })}
                            className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition ${
                                config.type === fx.id 
                                ? 'bg-pidgey-accent/20 border-pidgey-accent text-pidgey-accent' 
                                : 'bg-pidgey-dark border-pidgey-border text-pidgey-muted hover:text-white hover:border-white/50'
                            }`}
                        >
                            {/* @ts-ignore */}
                            <fx.icon size={20} />
                            <span className="text-[10px] font-bold uppercase">{fx.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {config.type !== 'none' && (
                <div className="bg-pidgey-dark p-3 rounded-lg border border-pidgey-border animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-pidgey-muted uppercase">Effect Intensity</span>
                        <span className="text-[10px] font-mono text-white">{config.intensity}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={config.intensity} 
                        onChange={e => onChange({...config, intensity: parseInt(e.target.value)})} 
                        className="w-full h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent"
                    />
                </div>
            )}
        </div>
    );
};
