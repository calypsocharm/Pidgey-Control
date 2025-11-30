
import React from 'react';
import { TextConfig } from '../../types';

interface TextEditorProps {
    config: TextConfig;
    onChange: (config: TextConfig) => void;
    showOverlay: boolean;
    onToggleOverlay: (show: boolean) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ config, onChange, showOverlay, onToggleOverlay }) => {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase">Text Overlay</h3>
                <button 
                    onClick={() => onToggleOverlay(!showOverlay)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${showOverlay ? 'bg-pidgey-accent' : 'bg-pidgey-border'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showOverlay ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
            </div>

            <textarea 
                value={config.text}
                onChange={e => onChange({...config, text: e.target.value})}
                className="w-full h-20 bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-sm focus:border-pidgey-accent outline-none text-white"
                placeholder="Enter text..."
            />

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 block">Font</label>
                    <select 
                        value={config.font}
                        onChange={e => onChange({...config, font: e.target.value as any})}
                        className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-xs text-white"
                    >
                        <option value="font-handwriting">Dancing Script</option>
                        <option value="font-sans">Inter Sans</option>
                        <option value="font-serif">Merriweather</option>
                        <option value="font-mono">JetBrains Mono</option>
                    </select>
                </div>
                <div>
                    <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 block">Size</label>
                    <input 
                        type="number" 
                        value={config.size}
                        onChange={e => onChange({...config, size: parseInt(e.target.value)})}
                        className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-xs text-white"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 block">Color</label>
                    <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1.5">
                        <input type="color" value={config.color} onChange={e => onChange({...config, color: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                        <span className="text-[10px] font-mono text-white">{config.color}</span>
                    </div>
                </div>
                <div className="flex-1">
                    <label className="text-[9px] font-bold text-pidgey-muted uppercase mb-1 block">Shadow</label>
                    <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1.5">
                        <input type="color" value={config.shadowColor} onChange={e => onChange({...config, shadowColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                        <span className="text-[10px] font-mono text-white">{config.shadowColor}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
