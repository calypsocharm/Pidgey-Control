
import React from 'react';
import { X, Tag, Sparkles, CheckCircle2, Palette, Loader } from 'lucide-react';
import { Stamp, StampRarity } from '../../types';
import { useNavigate } from 'react-router-dom';

interface DesignationModalProps {
    isOpen: boolean;
    onClose: () => void;
    stamp: Stamp | null;
    onUpdate: (updates: Partial<Stamp>) => void;
    onSave: () => void;
    onAutoName: () => void;
    onPidgeyFill: () => void;
    isFilling: boolean;
    isSaving?: boolean;
}

// Reusing the visual logic for consistency
const getStampVisuals = (r: StampRarity) => {
    switch(r) {
        case StampRarity.COMMON: 
            return { border: 'border-transparent', glow: '', badge: 'bg-slate-500 text-white', container: 'bg-slate-50' };
        case StampRarity.RARE: 
            return { border: 'border-yellow-400', glow: '', badge: 'bg-yellow-500 text-yellow-900', container: 'bg-yellow-50' };
        case StampRarity.FOIL: 
            return { border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]', badge: 'bg-blue-500 text-white', container: 'bg-blue-50' };
        case StampRarity.LEGENDARY: 
            return { border: 'border-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]', badge: 'bg-amber-500 text-white', container: 'bg-amber-50' };
        case StampRarity.PIDGEY: 
            return { border: 'border-purple-500', glow: 'shadow-[0_0_25px_rgba(168,85,247,0.7)]', badge: 'bg-purple-600 text-white', container: 'bg-purple-50' };
        default: 
            return { border: 'border-transparent', glow: '', badge: 'bg-gray-500', container: 'bg-slate-50' };
    }
};

export const DesignationModal: React.FC<DesignationModalProps> = ({ 
    isOpen, onClose, stamp, onUpdate, onSave, onAutoName, onPidgeyFill, isFilling, isSaving = false
}) => {
    const navigate = useNavigate();

    if (!isOpen || !stamp) return null;
    
    const visuals = getStampVisuals(stamp.rarity);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in zoom-in-95 duration-200">
                {/* Left: Preview */}
                <div className="w-full md:w-1/3 bg-pidgey-dark p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-pidgey-border relative flex-col gap-4">
                    
                    {/* STAMP VISUAL */}
                    <div className="relative w-full aspect-[3/4] bg-white rounded-sm flex items-center justify-center shadow-2xl border-[6px] border-dotted border-pidgey-dark p-1">
                        
                        {/* Inner Frame with Rarity */}
                        <div className={`w-full h-full flex items-center justify-center relative overflow-hidden border-[4px] transition-all duration-500 ${visuals.border} ${visuals.glow} ${visuals.container}`}>
                             <img src={stamp.art_path} className="w-full h-full object-cover" />
                             
                             {/* Shine Effects */}
                             {(stamp.rarity === StampRarity.FOIL || stamp.rarity === StampRarity.LEGENDARY || stamp.rarity === StampRarity.PIDGEY) && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none mix-blend-overlay"></div>
                             )}
                        </div>

                        {/* Overlay Stats */}
                        <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur rounded p-2 text-center border border-white/10">
                            <div className="text-white font-bold text-sm">{stamp.name}</div>
                            <div className={`text-[10px] uppercase font-bold mt-1 inline-block px-2 rounded ${visuals.badge}`}>{stamp.rarity}</div>
                        </div>
                    </div>
                    
                    {/* Playground Bridge */}
                    <button 
                        onClick={() => navigate('/playground', { state: { loadStamp: stamp } })}
                        className="w-full py-2 bg-pidgey-panel border border-pidgey-border hover:border-pidgey-accent text-pidgey-muted hover:text-white rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-2 group"
                    >
                        <Palette size={14} className="group-hover:text-pidgey-accent" /> Adjust Art in Studio
                    </button>
                </div>

                {/* Right: Form */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Stamp Designation
                                <button 
                                    onClick={onPidgeyFill}
                                    disabled={isFilling}
                                    className="text-xs flex items-center gap-1 text-pidgey-accent bg-pidgey-accent/10 hover:bg-pidgey-accent/20 px-2 py-1 rounded transition ml-2"
                                >
                                    <Sparkles size={12} className={isFilling ? "animate-spin" : ""} />
                                    Pidgey Fill
                                </button>
                            </h2>
                            <p className="text-xs text-pidgey-muted">Define metadata to finalize this asset.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Official Name</label>
                            <div className="relative">
                                <input 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-white focus:border-pidgey-accent outline-none font-bold"
                                    value={stamp.name}
                                    onChange={e => onUpdate({ name: e.target.value })}
                                />
                                <button 
                                    onClick={onAutoName}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-pidgey-muted hover:text-pidgey-accent p-1"
                                    title="Auto-Name"
                                >
                                    <Sparkles size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Rarity Tier</label>
                                <select 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white outline-none"
                                    value={stamp.rarity}
                                    onChange={e => onUpdate({ rarity: e.target.value as StampRarity })}
                                >
                                    {Object.values(StampRarity).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Collection Tag</label>
                                <input 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white outline-none"
                                    value={stamp.collection || ''}
                                    onChange={e => onUpdate({ collection: e.target.value })}
                                    placeholder="e.g. Season 1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Artist Name</label>
                            <input 
                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white outline-none"
                                value={stamp.artist_name || ''}
                                onChange={e => onUpdate({ artist_name: e.target.value })}
                                placeholder="e.g. Pidgey Studios"
                            />
                        </div>

                        <div className="bg-pidgey-dark rounded-xl p-4 border border-pidgey-border">
                            <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Tag size={14}/> Supply & Value</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-pidgey-muted uppercase mb-1">Edition Count (Supply)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-pidgey-panel border border-pidgey-border rounded p-2 text-white outline-none"
                                        value={stamp.edition_count || ''}
                                        onChange={e => onUpdate({ edition_count: parseInt(e.target.value) || 0 })}
                                        placeholder="Total Supply"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-pidgey-muted uppercase mb-1">Base Price (Eggs)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-pidgey-panel border border-pidgey-border rounded p-2 text-white outline-none"
                                        value={stamp.price_eggs || 0}
                                        onChange={e => onUpdate({ price_eggs: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="dropOnly"
                                    checked={stamp.is_drop_only}
                                    onChange={e => onUpdate({ is_drop_only: e.target.checked })}
                                    className="rounded border-pidgey-border bg-pidgey-panel text-pidgey-accent"
                                />
                                <label htmlFor="dropOnly" className="text-xs text-pidgey-muted cursor-pointer select-none">Drop Exclusive (Cannot be bought in store)</label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-pidgey-border flex justify-end gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-pidgey-muted hover:text-white transition">Cancel</button>
                            <button 
                                onClick={onSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-gradient-to-r from-pidgey-accent to-pidgey-secondary text-pidgey-dark font-bold rounded-lg hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                                {isSaving ? 'Finalizing...' : 'Finalize & Ready'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
