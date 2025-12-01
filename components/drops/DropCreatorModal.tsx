
import React from 'react';
import { Save, Sparkles, X, History, Undo2, Library, ArrowRight, Box, CheckCircle2 } from 'lucide-react';
import { Drop, DropStatus, Stamp, StampRarity } from '../../types';

interface DropCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    drop: Partial<Drop>;
    onUpdate: (updates: Partial<Drop>) => void;
    dropStamps: Partial<Stamp>[];
    onToggleStamp: (stamp: Stamp) => void;
    readyStamps: Stamp[];
    onSave: () => void;
    onPidgeyFill: () => void;
    isFilling: boolean;
    onRevert?: () => void; // Optional rollback action
    isDraftView?: boolean; // If showing drafts or sent items
    isStampSelectorOpen: boolean;
    setIsStampSelectorOpen: (open: boolean) => void;
}

export const DropCreatorModal: React.FC<DropCreatorModalProps> = ({
    isOpen, onClose, drop, onUpdate, dropStamps, onToggleStamp, readyStamps,
    onSave, onPidgeyFill, isFilling, onRevert, isStampSelectorOpen, setIsStampSelectorOpen
}) => {
    if (!isOpen) return null;

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
            <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {drop.id ? 'Edit Campaign' : 'New Drop Campaign'}
                            <button 
                                onClick={onPidgeyFill}
                                disabled={isFilling}
                                className="text-xs flex items-center gap-1 text-pidgey-accent bg-pidgey-accent/10 hover:bg-pidgey-accent/20 px-2 py-1 rounded transition ml-2 border border-pidgey-accent/30"
                            >
                                <Sparkles size={12} className={isFilling ? "animate-spin" : ""} />
                                Auto-Fill with Pidgey
                            </button>
                        </h2>
                        <p className="text-xs text-pidgey-muted">Configure campaign details and select assets.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="text-pidgey-muted hover:text-white px-3">Cancel</button>
                        <button onClick={onSave} className="px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg flex items-center gap-2 hover:bg-teal-300">
                            <Save size={16} /> Save Campaign
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Config */}
                    <div className="w-1/3 border-r border-pidgey-border p-6 overflow-y-auto bg-pidgey-dark/50">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">1. Campaign Details</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Title</label>
                                <input 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                    value={drop.title || ''}
                                    onChange={e => onUpdate({ title: e.target.value })}
                                    placeholder="e.g. Winter Wonderland"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Single Price</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                        value={drop.egg_price || 0}
                                        onChange={e => onUpdate({ egg_price: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Bundle Price</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                        value={drop.bundle_price || ''}
                                        onChange={e => onUpdate({ bundle_price: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Schedule</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="date"
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2 text-xs text-white"
                                        value={drop.start_at ? drop.start_at.split('T')[0] : ''}
                                        onChange={e => onUpdate({ start_at: new Date(e.target.value).toISOString() })}
                                    />
                                    <input 
                                        type="date"
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2 text-xs text-white"
                                        value={drop.end_at ? drop.end_at.split('T')[0] : ''}
                                        onChange={e => onUpdate({ end_at: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Status</label>
                                <select 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                    value={drop.status || 'draft'}
                                    onChange={e => onUpdate({ status: e.target.value as DropStatus })}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="live">Live</option>
                                    <option value="ended">Ended</option>
                                </select>
                            </div>

                            {/* Archive Log / Revert */}
                            {onRevert && drop.id && (
                                <div className="p-4 bg-pidgey-dark border border-pidgey-border rounded-lg mt-4">
                                    <div className="flex items-center gap-2 mb-2 text-white font-bold text-xs uppercase">
                                        <History size={14} className="text-pidgey-muted" /> Archive Log
                                    </div>
                                    <button 
                                        onClick={onRevert}
                                        className="w-full px-3 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded hover:bg-orange-500/20 text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <Undo2 size={12} /> Revert to Draft
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Stamp Selector */}
                    <div className="w-2/3 p-6 overflow-y-auto bg-pidgey-panel relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Selected Assets ({dropStamps.length})</h3>
                            <button 
                                onClick={() => setIsStampSelectorOpen(true)}
                                className="bg-pidgey-accent text-pidgey-dark px-4 py-2 rounded-lg font-bold text-sm hover:bg-teal-300 transition flex items-center gap-2"
                            >
                                <Library size={16} /> Select From Inventory
                            </button>
                        </div>

                        {dropStamps.length === 0 ? (
                            <div className="border-2 border-dashed border-pidgey-border rounded-xl h-64 flex flex-col items-center justify-center text-pidgey-muted">
                                <Box size={40} className="opacity-20 mb-2" />
                                <p>No stamps selected.</p>
                                <button onClick={() => setIsStampSelectorOpen(true)} className="text-pidgey-accent hover:underline text-sm font-bold mt-2">Open Asset Selector</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {dropStamps.map(stamp => (
                                    <div key={stamp.id} className="bg-pidgey-dark border border-pidgey-border rounded-xl p-3 relative group">
                                        <button 
                                            onClick={() => onToggleStamp(stamp as Stamp)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                        <div className="aspect-[3/4] bg-white rounded-sm mb-2 flex items-center justify-center overflow-hidden border-[4px] border-dotted border-pidgey-dark p-0.5">
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                                <img src={stamp.art_path} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="font-bold text-xs truncate text-white">{stamp.name}</div>
                                        <div className={`text-[9px] px-1.5 rounded uppercase inline-block mt-1 ${getRarityColor(stamp.rarity as StampRarity)}`}>
                                            {stamp.rarity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Overlay Selector Panel */}
                        {isStampSelectorOpen && (
                            <div className="absolute inset-0 bg-pidgey-panel z-20 flex flex-col animate-in slide-in-from-bottom-4">
                                <div className="p-4 border-b border-pidgey-border bg-pidgey-dark flex justify-between items-center">
                                    <h3 className="font-bold text-white">Select Ready Stamps</h3>
                                    <button onClick={() => setIsStampSelectorOpen(false)} className="text-pidgey-muted hover:text-white flex items-center gap-1 text-xs font-bold uppercase">
                                        Done <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 bg-pidgey-panel">
                                    {readyStamps.length === 0 ? (
                                        <div className="text-center text-pidgey-muted py-12">
                                            No "Ready" stamps found. Go to Inventory and designate drafts first.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
                                            {readyStamps.map(stamp => {
                                                const isSelected = dropStamps.some(s => s.id === stamp.id);
                                                return (
                                                    <div 
                                                        key={stamp.id} 
                                                        onClick={() => onToggleStamp(stamp)}
                                                        className={`border rounded-xl p-3 cursor-pointer transition-all ${
                                                            isSelected 
                                                            ? 'bg-pidgey-accent/10 border-pidgey-accent ring-1 ring-pidgey-accent' 
                                                            : 'bg-pidgey-dark border-pidgey-border hover:border-pidgey-muted'
                                                        }`}
                                                    >
                                                        <div className="aspect-[3/4] bg-white rounded-sm mb-2 flex items-center justify-center overflow-hidden relative border-[4px] border-dotted border-pidgey-dark p-0.5">
                                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                                                <img src={stamp.art_path} className="w-full h-full object-cover" />
                                                            </div>
                                                            {isSelected && (
                                                                <div className="absolute inset-0 bg-pidgey-accent/20 flex items-center justify-center z-10">
                                                                    <CheckCircle2 className="text-pidgey-accent bg-pidgey-dark rounded-full shadow-lg" size={24} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="font-bold text-xs truncate text-white">{stamp.name}</div>
                                                        <div className="flex justify-between mt-1">
                                                            <span className="text-[9px] text-pidgey-muted uppercase">{stamp.edition_count} Supply</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
