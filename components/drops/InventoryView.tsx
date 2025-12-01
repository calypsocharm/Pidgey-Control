
import React, { useState, useEffect } from 'react';
import { Box, Undo2, Image as ImageIcon, Trash2, CheckCircle2, AlertOctagon, Package, ArrowRight, Archive } from 'lucide-react';
import { Stamp, StampStatus, StampRarity } from '../../types';

interface InventoryViewProps {
    stamps: Stamp[];
    loading: boolean;
    onSelectStamp: (stamp: Stamp) => void;
    onDeleteStamp: (e: React.MouseEvent, stamp: Stamp) => void;
    onRefresh: () => void;
}

const getStatusBadge = (status: StampStatus) => {
    switch(status) {
        case StampStatus.DRAFT: return <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold border border-red-500/20 flex items-center gap-1"><AlertOctagon size={10}/> Action Needed</span>;
        case StampStatus.READY: return <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1 border border-green-500/20"><CheckCircle2 size={10}/> Ready for Drop</span>;
        case StampStatus.ACTIVE: return <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase font-bold border border-purple-500/20">Live</span>;
        case StampStatus.DROPPED: return <span className="text-[9px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-500/20">Archived (Dropped)</span>;
        case StampStatus.ARCHIVED: return <span className="text-[9px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-500/20">Archived</span>;
        default: return null;
    }
};

// Visual Rarity Logic
const getStampVisuals = (r: StampRarity) => {
    switch(r) {
        case StampRarity.COMMON: 
            return {
                border: 'border-transparent',
                glow: '',
                badge: 'bg-slate-500 text-white',
                container: 'bg-slate-50'
            };
        case StampRarity.RARE: 
            return {
                border: 'border-yellow-400',
                glow: '',
                badge: 'bg-yellow-500 text-yellow-900',
                container: 'bg-yellow-50'
            };
        case StampRarity.FOIL: 
            return {
                border: 'border-blue-400',
                glow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]',
                badge: 'bg-blue-500 text-white',
                container: 'bg-blue-50'
            };
        case StampRarity.LEGENDARY: 
            return {
                border: 'border-amber-400',
                glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]',
                badge: 'bg-amber-500 text-white',
                container: 'bg-amber-50'
            };
        case StampRarity.PIDGEY: 
            return {
                border: 'border-purple-500',
                glow: 'shadow-[0_0_25px_rgba(168,85,247,0.7)]',
                badge: 'bg-purple-600 text-white',
                container: 'bg-purple-50'
            };
        default: 
            return { border: 'border-transparent', glow: '', badge: 'bg-gray-500', container: 'bg-slate-50' };
    }
};

export const InventoryView: React.FC<InventoryViewProps> = ({ stamps, loading, onSelectStamp, onDeleteStamp, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'vault' | 'archive'>('inbox');
    
    // Categorize Stamps
    const draftStamps = stamps.filter(s => s.status === StampStatus.DRAFT);
    const readyStamps = stamps.filter(s => s.status === StampStatus.READY || s.status === StampStatus.ACTIVE);
    const archivedStamps = stamps.filter(s => s.status === StampStatus.DROPPED || s.status === StampStatus.ARCHIVED);
    
    // Determine displayed list
    const displayedStamps = activeTab === 'inbox' ? draftStamps : activeTab === 'vault' ? readyStamps : archivedStamps;

    // Auto-switch tab if inbox is empty but vault has items
    useEffect(() => {
        if (!loading && activeTab === 'inbox' && draftStamps.length === 0 && readyStamps.length > 0) {
            setActiveTab('vault');
        }
    }, [loading, draftStamps.length, readyStamps.length]);

    return (
        <section>
            <div className="bg-pidgey-panel border border-pidgey-border rounded-xl flex flex-col min-h-[500px] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark/30">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Box size={20} className="text-pidgey-accent" /> Stamp Inventory
                        </h2>
                        <p className="text-xs text-pidgey-muted">
                            Holding area for approved assets. Finalize drafts here before adding them to a Drop.
                        </p>
                    </div>
                    <button onClick={onRefresh} className="text-pidgey-muted hover:text-white p-2 rounded hover:bg-white/5 transition"><Undo2 size={16}/></button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-pidgey-border bg-pidgey-dark">
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border-b-2 ${
                            activeTab === 'inbox' 
                            ? 'bg-pidgey-panel text-red-400 border-red-400' 
                            : 'text-pidgey-muted border-transparent hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <AlertOctagon size={14} /> Inbox: Action Needed ({draftStamps.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('vault')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border-b-2 ${
                            activeTab === 'vault' 
                            ? 'bg-pidgey-panel text-green-400 border-green-400' 
                            : 'text-pidgey-muted border-transparent hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Package size={14} /> Vault: Ready for Drops ({readyStamps.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('archive')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border-b-2 ${
                            activeTab === 'archive' 
                            ? 'bg-pidgey-panel text-slate-400 border-slate-400' 
                            : 'text-pidgey-muted border-transparent hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Archive size={14} /> Past Dropped Stamps ({archivedStamps.length})
                    </button>
                </div>
                
                {/* Content Grid */}
                <div className="p-6 flex-1 bg-pidgey-panel">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-pidgey-muted">
                            <div className="w-8 h-8 border-2 border-pidgey-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="text-xs font-bold uppercase">Loading Inventory...</span>
                        </div>
                    ) : displayedStamps.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-pidgey-muted border-2 border-dashed border-pidgey-border rounded-xl min-h-[300px]">
                            {activeTab === 'inbox' ? (
                                <>
                                    <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500 opacity-50"/>
                                    <p className="font-bold">All caught up!</p>
                                    <p className="text-xs mt-1">No pending drafts. Go to the <span className="text-green-400 cursor-pointer" onClick={() => setActiveTab('vault')}>Vault</span> to see your ready stamps.</p>
                                </>
                            ) : activeTab === 'vault' ? (
                                <>
                                    <ImageIcon size={48} className="mx-auto mb-4 opacity-20"/>
                                    <p className="font-bold">Vault is Empty</p>
                                    <p className="text-xs mt-1">Approve some drafts in Pidgey Creations first.</p>
                                </>
                            ) : (
                                <>
                                    <Archive size={48} className="mx-auto mb-4 opacity-20"/>
                                    <p className="font-bold">No Archived Stamps</p>
                                    <p className="text-xs mt-1">Once a drop goes live, stamps will appear here.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in duration-300">
                            {displayedStamps.map(stamp => {
                                const visuals = getStampVisuals(stamp.rarity);
                                const isArchived = stamp.status === StampStatus.DROPPED || stamp.status === StampStatus.ARCHIVED;
                                
                                return (
                                    <div 
                                        key={stamp.id} 
                                        onClick={() => !isArchived && onSelectStamp(stamp)}
                                        className={`bg-pidgey-dark border rounded-xl p-3 relative shadow-sm transition-all ${
                                            isArchived 
                                            ? 'border-slate-500/20 opacity-70 grayscale-[0.5] cursor-default' 
                                            : stamp.status === StampStatus.READY 
                                                ? 'border-green-500/20 hover:border-green-500 cursor-pointer hover:-translate-y-1 group' 
                                                : 'border-red-500/20 hover:border-red-500 cursor-pointer hover:-translate-y-1 group'
                                        }`}
                                    >
                                        {/* STAMP VISUAL */}
                                        <div className="aspect-[3/4] bg-white rounded-sm mb-3 flex items-center justify-center overflow-hidden relative border-[6px] border-dotted border-pidgey-dark p-1">
                                            
                                            {/* Rarity Inner Frame */}
                                            <div className={`w-full h-full relative overflow-hidden border-[3px] transition-all duration-500 ${visuals.border} ${visuals.glow} ${visuals.container}`}>
                                                {stamp.art_path ? (
                                                    <img src={stamp.art_path} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={24} className="opacity-20 text-pidgey-dark m-auto"/>
                                                )}
                                                
                                                {/* Foil/Shine Effects */}
                                                {(stamp.rarity === StampRarity.FOIL || stamp.rarity === StampRarity.LEGENDARY || stamp.rarity === StampRarity.PIDGEY) && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none mix-blend-overlay"></div>
                                                )}
                                            </div>
                                            
                                            {/* Hover Overlay (Only for active items) */}
                                            {!isArchived && (
                                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm z-10 ${
                                                    stamp.status === StampStatus.DRAFT ? 'bg-red-900/40' : 'bg-green-900/40'
                                                }`}>
                                                    <span className={`text-pidgey-dark text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase flex items-center gap-1 ${
                                                        stamp.status === StampStatus.DRAFT ? 'bg-red-400' : 'bg-green-400'
                                                    }`}>
                                                        {stamp.status === StampStatus.DRAFT ? 'Designate' : 'Edit'} <ArrowRight size={10} />
                                                    </span>
                                                </div>
                                            )}

                                            {/* Status Icon */}
                                            {stamp.status === StampStatus.READY && (
                                                <div className="absolute top-1 right-1 bg-green-500 text-pidgey-dark p-0.5 rounded-full shadow-md z-10">
                                                    <CheckCircle2 size={10} />
                                                </div>
                                            )}
                                            {stamp.status === StampStatus.DRAFT && (
                                                <div className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full shadow-md z-10 animate-pulse">
                                                    <AlertOctagon size={10} />
                                                </div>
                                            )}

                                            {/* DELETE BUTTON (Hidden for archived) */}
                                            {!isArchived && (
                                                <button 
                                                    onClick={(e) => onDeleteStamp(e, stamp)}
                                                    className="absolute top-1 left-1 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 shadow-md"
                                                    title="Delete Stamp"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="font-bold text-xs truncate text-white mb-1" title={stamp.name}>{stamp.name}</div>
                                        <div className="flex justify-between items-center mb-2">
                                             <span className={`text-[9px] px-1.5 rounded uppercase font-bold ${visuals.badge}`}>{stamp.rarity}</span>
                                        </div>
                                        {getStatusBadge(stamp.status)}
                                        {stamp.edition_count ? (
                                             <div className="mt-2 text-[9px] text-pidgey-muted font-mono">Supply: {stamp.edition_count}</div>
                                        ) : (
                                            <div className="mt-2 text-[9px] text-red-400 font-bold flex items-center gap-1"><AlertOctagon size={8}/> Set Supply</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
