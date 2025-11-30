
import React from 'react';
import { Square, Zap } from 'lucide-react';
import { BorderConfig } from '../../types';

interface BorderEditorProps {
    config: BorderConfig;
    onChange: (config: BorderConfig) => void;
}

export const BorderEditor: React.FC<BorderEditorProps> = ({ config, onChange }) => {
    return (
        <div>
             <div className="flex justify-between items-center mb-3">
                 <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2"><Square size={14} className="text-pidgey-accent"/> Border Editor</h3>
                 <button 
                    onClick={() => onChange({ ...config, enabled: !config.enabled })}
                    className={`w-8 h-4 rounded-full relative transition-colors ${config.enabled ? 'bg-pidgey-accent' : 'bg-pidgey-border'}`}
                 >
                     <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.enabled ? 'left-4.5' : 'left-0.5'}`}></div>
                 </button>
             </div>
             
             <div className={`space-y-4 ${!config.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                 {/* Material Selector */}
                 <div className="grid grid-cols-3 gap-2">
                     {['none', 'matte', 'gold', 'silver', 'neon', 'holo'].map(mat => (
                         <button 
                            key={mat}
                            onClick={() => onChange({ ...config, material: mat as any })}
                            className={`text-[9px] font-bold uppercase p-1.5 rounded border text-center transition ${config.material === mat ? 'bg-pidgey-accent text-pidgey-dark border-pidgey-accent' : 'border-pidgey-border text-pidgey-muted hover:border-white'}`}
                         >
                             {mat}
                         </button>
                     ))}
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 block">Color</label>
                         <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1.5">
                            <input type="color" value={config.color} onChange={e => onChange({...config, color: e.target.value})} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent" />
                            <span className="text-[9px] font-mono text-white truncate">{config.color}</span>
                        </div>
                     </div>
                     <div>
                         <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 block">Style</label>
                         <select value={config.style} onChange={e => onChange({...config, style: e.target.value as any})} className="w-full bg-pidgey-dark border border-pidgey-border rounded p-1.5 text-[10px] text-white outline-none">
                            <option value="solid">Solid</option>
                            <option value="perforated">Perforated</option>
                            <option value="dotted">Dotted</option>
                            <option value="dashed">Dashed</option>
                            <option value="double">Double</option>
                        </select>
                     </div>
                 </div>

                 <div>
                     <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 flex justify-between">
                         <span>Thickness (Padding)</span> <span>{config.thickness}px</span>
                     </label>
                     <input type="range" min="0" max="40" value={config.thickness} onChange={e => onChange({...config, thickness: parseInt(e.target.value)})} className="w-full h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent" />
                 </div>
                 
                 <div>
                     <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 flex justify-between">
                         <span>Corner Radius</span> <span>{config.radius}px</span>
                     </label>
                     <input type="range" min="0" max="160" value={config.radius} onChange={e => onChange({...config, radius: parseInt(e.target.value)})} className="w-full h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent" />
                 </div>

                 <div>
                     <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 flex justify-between">
                         <span>Inner Frame</span> <span>{config.innerThickness}px</span>
                     </label>
                     <div className="flex gap-2">
                          <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1.5 flex-1">
                             <input type="color" value={config.innerColor} onChange={e => onChange({...config, innerColor: e.target.value})} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent" />
                             <span className="text-[9px] font-mono text-white truncate">{config.innerColor}</span>
                         </div>
                         <div className="flex-[2]">
                             <input type="range" min="0" max="20" value={config.innerThickness} onChange={e => onChange({...config, innerThickness: parseInt(e.target.value)})} className="w-full h-full bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent" />
                         </div>
                     </div>
                 </div>
                 
                 <div className="p-3 bg-pidgey-dark rounded-lg border border-pidgey-border">
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-[9px] font-bold text-white uppercase flex items-center gap-1"><Zap size={10} className="text-yellow-400"/> Glow</span>
                         <input type="color" value={config.glowColor} onChange={e => onChange({...config, glowColor: e.target.value})} className="w-4 h-4 rounded cursor-pointer border-none bg-transparent" />
                     </div>
                     <input type="range" min="0" max="50" value={config.glowIntensity} onChange={e => onChange({...config, glowIntensity: parseInt(e.target.value)})} className="w-full h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                 </div>
             </div>
        </div>
    );
};
