
import React from 'react';
import { X, Tag, Sparkles, CheckCircle2, Palette } from 'lucide-react';
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
}

export const DesignationModal: React.FC<DesignationModalProps> = ({ 
    isOpen, onClose, stamp, onUpdate, onSave, onAutoName, onPidgeyFill, isFilling 
}) => {
    const navigate = useNavigate();

    if (!isOpen || !stamp) return null;

    const getRarityColor = (r: StampRarity) => {
        switch(r) {
            case StampRarity.COMMON: return 'bg-slate-500 text-white';
            case StampRarity.RARE: return 'bg-blue-500 text-white';
            case StampRarity.LEGENDARY: return 'bg-yellow-500 text-yellow-900';
            case StampRarity.PIDGEY: return 'bg-purple-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in zoom-in-95 duration-200">
                {/* Left: Preview */}
                <div className="w-full md:w-1/3 bg-pidgey-dark p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-pidgey-border relative flex-col gap-4">
                    <div className="relative w-full aspect-[3/4] bg-white rounded-sm flex items-center justify-center shadow-2xl border-[6px] border-dotted border-pidgey-dark p-1">
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
                             <img src={stamp.art_path} className="w-full h-full object-cover" />
                        </div>
                        {/* Overlay Stats */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur rounded p-2 text-center">
                            <div className="text-white font-bold text-sm">{stamp.name}</div>
                            <div className={`text-[10px] uppercase font-bold mt-1 inline-block px-2 rounded ${getRarityColor(stamp.rarity)}`}>{stamp.rarity}</div>
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

                        <div className="bg-pidgey-dark rounded-xl p-4 border border-pidgey-border">
                            <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Tag size={14}/> Supply & Value</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-pidgey-muted uppercase mb-1">Edition Count (Supply)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-pidgey-panel border border-pidgey-border rounded p-2 text-white outline-none"
                                        value={stamp.edition_count || ''}
                                        onChange={e => onUpdate({ edition_count: parseInt(e.target.value) })}
                                        placeholder="Total Supply"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-pidgey-muted uppercase mb-1">Base Price (Eggs)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-pidgey-panel border border-pidgey-border rounded p-2 text-white outline-none"
                                        value={stamp.price_eggs || 0}
                                        onChange={e => onUpdate({ price_eggs: parseInt(e.target.value) })}
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
                                className="px-6 py-2 bg-gradient-to-r from-pidgey-accent to-pidgey-secondary text-pidgey-dark font-bold rounded-lg hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
                            >
                                <CheckCircle2 size={18} /> Finalize & Ready
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
