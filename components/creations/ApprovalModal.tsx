
import React from 'react';
import { Sparkles, XCircle, MapPin, Save, Tag, CheckCircle2, User } from 'lucide-react';
import { CreationDraft, StampRarity } from '../../types';

interface ApprovalModalProps {
    draft: CreationDraft | null;
    formData: any;
    setFormData: (data: any) => void;
    onClose: () => void;
    onSave: () => void;
    onPidgeyFill: () => void;
    isFilling: boolean;
    isSaving: boolean;
}

const getDestinationHint = (type: string) => {
    switch(type) {
        case 'stamp': return 'Stamp Inventory (Status: Draft) → Needs Designation';
        case 'drop': return 'Drops List (Status: Draft) → Needs Stamp Selection';
        case 'broadcast': return 'Broadcasts List (Status: Draft) → Needs Scheduling';
        case 'promo': return 'Promos List (Status: Draft)';
        case 'member': return 'Members Directory (Status: Active)';
        default: return 'Database';
    }
};

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ 
    draft, formData, setFormData, onClose, onSave, onPidgeyFill, isFilling, isSaving 
}) => {
    if (!draft) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-pidgey-panel border border-pidgey-border rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                {/* Header */}
                <div className="p-6 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark/30">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-3 text-pidgey-text">
                            <div className="p-1.5 bg-pidgey-accent/20 rounded-lg text-pidgey-accent"><Sparkles size={18} /></div>
                            Finalize {draft.type}
                            <button 
                                onClick={onPidgeyFill}
                                disabled={isFilling}
                                className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-pidgey-accent bg-pidgey-accent/10 hover:bg-pidgey-accent/20 px-3 py-1.5 rounded-full transition ml-2 border border-pidgey-accent/30"
                            >
                                <Sparkles size={10} className={isFilling ? "animate-spin" : ""} />
                                Auto-Fill
                            </button>
                        </h2>
                        <p className="text-xs text-pidgey-muted mt-1 ml-10">Review attributes before saving.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-pidgey-dark rounded-full text-pidgey-muted hover:text-pidgey-text transition"><XCircle size={24}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-pidgey-panel">
                    
                    {/* STAMP EDITOR */}
                    {draft.type === 'stamp' && (
                        <div className="flex gap-8">
                            {/* Left: Preview */}
                            <div className="w-1/3 flex items-center justify-center bg-pidgey-dark rounded-2xl border border-pidgey-border p-6 relative">
                                    <div className="aspect-[3/4] w-full flex items-center justify-center relative shadow-2xl transition-all bg-white p-1 rounded-sm border-[6px] border-dotted border-pidgey-dark">
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                            <img src={formData.art_path} className="w-full h-full object-cover" 
                                            onError={(e) => (e.target as HTMLImageElement).src='https://via.placeholder.com/300x400'}
                                            />
                                        </div>
                                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white uppercase font-bold tracking-wider shadow-sm">{formData.rarity}</div>
                                    </div>
                            </div>
                            
                            {/* Right: Form */}
                            <div className="flex-1 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1.5 ml-1">Official Name</label>
                                    <input 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3.5 text-pidgey-text focus:border-pidgey-accent focus:bg-pidgey-dark/50 outline-none font-bold text-lg transition-all"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1.5 ml-1">Rarity</label>
                                        <select 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3 text-pidgey-text text-sm focus:border-pidgey-accent outline-none appearance-none"
                                            value={formData.rarity}
                                            onChange={e => setFormData({...formData, rarity: e.target.value})}
                                        >
                                            {Object.values(StampRarity).map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1.5 ml-1">Collection</label>
                                        <input 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3 text-pidgey-text text-sm focus:border-pidgey-accent outline-none"
                                            value={formData.collection || ''}
                                            onChange={e => setFormData({...formData, collection: e.target.value})}
                                            placeholder="e.g. Origins"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1.5 ml-1 flex items-center gap-1"><User size={12}/> Artist ID</label>
                                    <input 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3 text-pidgey-text text-sm focus:border-pidgey-accent outline-none font-mono text-xs"
                                        value={formData.artist_id || ''}
                                        onChange={e => setFormData({...formData, artist_id: e.target.value})}
                                        placeholder="e.g. Pidgey Studios"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1.5 ml-1">Price (Eggs)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3 text-pidgey-text text-sm focus:border-pidgey-accent outline-none"
                                            value={formData.price_eggs}
                                            onChange={e => setFormData({...formData, price_eggs: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1.5 ml-1">Supply</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3 text-pidgey-text text-sm focus:border-pidgey-accent outline-none"
                                            value={formData.edition_count}
                                            onChange={e => setFormData({...formData, edition_count: parseInt(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-4 bg-pidgey-dark border border-pidgey-border rounded-xl cursor-pointer hover:bg-pidgey-dark/50 transition">
                                    <input 
                                        type="checkbox"
                                        id="dropOnly"
                                        checked={formData.is_drop_only}
                                        onChange={e => setFormData({...formData, is_drop_only: e.target.checked})}
                                        className="w-5 h-5 rounded border-pidgey-border bg-pidgey-panel text-pidgey-accent focus:ring-offset-0 focus:ring-pidgey-accent"
                                    />
                                    <label htmlFor="dropOnly" className="text-xs font-bold text-pidgey-muted cursor-pointer uppercase tracking-wide select-none">Drop Exclusive (Not in Store)</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GENERIC EDITOR (Drops/Broadcasts/Promos) */}
                    {draft.type !== 'stamp' && (
                        <div className="space-y-6">
                            {Object.entries(formData).map(([key, value]) => {
                                if (key === 'design_config' || key === 'id' || key === 'created_at' || typeof value === 'object') return null;
                                return (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1.5 ml-1">{key.replace(/_/g, ' ')}</label>
                                        <input 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3.5 text-pidgey-text focus:border-pidgey-accent outline-none transition-all"
                                            value={value as string}
                                            onChange={e => setFormData({...formData, [key]: e.target.value})}
                                        />
                                    </div>
                                );
                            })}
                                <div className="p-4 bg-pidgey-dark rounded-2xl border border-dashed border-pidgey-border text-center text-pidgey-muted text-sm">
                                    <p>Additional configuration for <strong>{draft.type}</strong> is available in the edit screen after saving.</p>
                                </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-pidgey-border bg-pidgey-dark/30 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-xs text-pidgey-muted bg-pidgey-dark/50 p-2 rounded-lg border border-pidgey-border">
                        <MapPin size={14} className="text-pidgey-accent" />
                        <span className="font-bold uppercase tracking-wide text-[10px]">Destination:</span>
                        <span className="text-pidgey-text font-mono">{getDestinationHint(draft.type)}</span>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-pidgey-muted hover:text-white hover:bg-white/5 transition">Cancel</button>
                        <button 
                            onClick={onSave}
                            disabled={isSaving}
                            className="px-8 py-3 bg-pidgey-accent text-pidgey-dark font-bold rounded-xl hover:bg-teal-300 transition flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50"
                        >
                            {isSaving ? <Sparkles className="animate-spin" size={18}/> : <Save size={18} />} 
                            {isSaving ? 'Saving...' : 'Finalize & Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
