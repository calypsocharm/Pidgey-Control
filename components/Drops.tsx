
import React, { useState, useEffect, useRef } from 'react';
import { Egg, Sparkles, Plus, Edit, Trash2, Calendar, Loader, Image as ImageIcon, CheckCircle2, Box, Undo2 } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Drop, DropStatus, Stamp, StampRarity, StampStatus } from '../types';
import { useJarvis } from '../JarvisContext';
import { generateStampName, generateFormContent } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { DesignationModal } from './drops/DesignationModal';
import { DropCreatorModal } from './drops/DropCreatorModal';

export const Drops = () => {
    // View State: 'campaigns' or 'inventory' (Designation Studio)
    const [activeView, setActiveView] = useState<'campaigns' | 'inventory'>('campaigns');
    
    // Inventory Filters
    const [inventoryFilter, setInventoryFilter] = useState<'all' | 'draft' | 'ready'>('all');
    
    // Campaign Data
    const [drops, setDrops] = useState<Drop[]>([]);
    
    // Inventory Data (Draft Stamps)
    const [inventoryStamps, setInventoryStamps] = useState<Stamp[]>([]);
    const [readyStamps, setReadyStamps] = useState<Stamp[]>([]); // For Drop Selector
    
    const [loading, setLoading] = useState(true);
    
    // Create/Edit Drop Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDrop, setCurrentDrop] = useState<Partial<Drop>>({});
    
    // Drop: Stamp Selection State
    const [dropStamps, setDropStamps] = useState<Partial<Stamp>[]>([]); // Selected for current drop
    const [isStampSelectorOpen, setIsStampSelectorOpen] = useState(false);
    
    // Designation Studio Modal State
    const [isDesignationOpen, setIsDesignationOpen] = useState(false);
    const [designatingStamp, setDesignatingStamp] = useState<Stamp | null>(null);
    
    // AI Filling States
    const [isFillingDrop, setIsFillingDrop] = useState(false);
    const [isFillingDesignation, setIsFillingDesignation] = useState(false);

    // Context for Pidgey's Drafts
    const { draftPayload, setDraftPayload } = useJarvis();
    const navigate = useNavigate();

    // Check for drafts on mount or when payload changes
    useEffect(() => {
        if (draftPayload && draftPayload.type === 'DRAFT_DROP') {
            console.log("Received draft drop from Pidgey:", draftPayload.data);
            setCurrentDrop(draftPayload.data);
            setDropStamps([]); // Pidgey usually drafts the campaign shell, not the exact assets
            setIsModalOpen(true);
            setDraftPayload(null); // Clear after consuming
        }
    }, [draftPayload, setDraftPayload]);
    
    // Fetch Data
    useEffect(() => {
        fetchData();
    }, [activeView]); // Refetch when switching views

    const fetchData = async () => {
        setLoading(true);
        if (activeView === 'campaigns') {
            const { data, error } = await AdminService.drops.list();
            if (!error) setDrops(data);
        } else {
            // Fetch ALL stamps
            const { data, error } = await AdminService.stamps.list();
            if (!error) {
                // For Inventory View: Show DRAFT and READY stamps
                setInventoryStamps(data.filter(s => s.status === StampStatus.DRAFT || s.status === StampStatus.READY));
                
                // For Drop Selector: Only READY
                setReadyStamps(data.filter(s => s.status === StampStatus.READY));
            }
        }
        setLoading(false);
    };

    // Load Ready stamps for Drop Creator
    const loadReadyStamps = async () => {
         const { data, error } = await AdminService.stamps.list();
         if (!error) {
             setReadyStamps(data.filter(s => s.status === StampStatus.READY));
         }
    };

    // --- Drop Management Handlers ---

    const handleAddNewDrop = () => {
        setCurrentDrop({
            title: '',
            description: '',
            egg_price: 1, // Default to 1
            bundle_price: 10,
            status: DropStatus.DRAFT,
            start_at: new Date().toISOString(),
            end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            artist_id: 'art_1', // default
            banner_path: 'https://picsum.photos/seed/new/800/200' 
        });
        setDropStamps([]);
        loadReadyStamps();
        setIsModalOpen(true);
    };

    const handleEditDrop = (drop: Drop) => {
        setCurrentDrop({ ...drop });
        // In real app, we would fetch the stamps linked to this drop here.
        // For now, mocking selection of some ready stamps
        setDropStamps(drop.stamps || []);
        loadReadyStamps();
        setIsModalOpen(true);
    };

    const handleSaveDrop = async () => {
        if (!currentDrop.title || !currentDrop.egg_price) return alert("Title and Price required");
        
        const payload = { 
            ...currentDrop,
            stamps: dropStamps 
        };
        
        let res;
        if (currentDrop.id) {
            res = await AdminService.drops.update(currentDrop.id, payload);
        } else {
            res = await AdminService.drops.create(payload as Drop);
        }

        if (res.error) {
            alert("Error saving drop: " + res.error.message);
        } else {
            setIsModalOpen(false);
            fetchData();
        }
    };

    const handleRevertToDraft = async () => {
        if (!currentDrop.id) return;
        if (!confirm("Are you sure you want to revert this Drop to DRAFT status? It will be hidden from users immediately.")) return;
        
        // Optimistic update
        setCurrentDrop({ ...currentDrop, status: DropStatus.DRAFT });
        
        const { error } = await AdminService.drops.update(currentDrop.id, { status: DropStatus.DRAFT });
        if (error) {
            alert("Failed to revert: " + error.message);
        } else {
             alert("Drop reverted to Draft.");
             fetchData();
        }
    };

    const handleArchiveDrop = async (id: string) => {
        if (!confirm("Are you sure you want to end this drop?")) return;
        await AdminService.drops.archive(id);
        fetchData();
    };

    const handlePidgeyFillDrop = async () => {
        setIsFillingDrop(true);
        const data = await generateFormContent('drop');
        if (data) {
            setCurrentDrop(prev => ({
                ...prev,
                ...data,
                // Ensure dates are valid
                start_at: data.start_at || prev.start_at,
                end_at: data.end_at || prev.end_at,
                // Defaults
                status: prev.status || DropStatus.DRAFT,
                artist_id: prev.artist_id || 'Pidgey Studios'
            }));
        }
        setIsFillingDrop(false);
    };

    // --- Drop Creator: Stamp Selector ---

    const toggleStampSelection = (stamp: Stamp) => {
        const exists = dropStamps.find(s => s.id === stamp.id);
        if (exists) {
            setDropStamps(prev => prev.filter(s => s.id !== stamp.id));
        } else {
            if (dropStamps.length >= 10) return alert("Max 10 stamps per drop.");
            setDropStamps(prev => [...prev, stamp]);
        }
    };

    // --- Stamp Designation Handlers ---

    const openDesignation = (stamp: Stamp) => {
        setDesignatingStamp({ ...stamp }); // Clone to edit
        setIsDesignationOpen(true);
    };

    const handleDeleteStamp = async (e: React.MouseEvent, stamp: Stamp) => {
        e.stopPropagation(); // Prevent opening modal
        if (!confirm(`Are you sure you want to delete "${stamp.name}"? This cannot be undone.`)) return;
        
        if (!stamp.id) return;

        // Call service
        const { error } = await AdminService.stamps.delete(stamp.id);
        if (error) {
            alert("Failed to delete: " + error.message);
        } else {
            // Update local state
            setInventoryStamps(prev => prev.filter(s => s.id !== stamp.id));
            setReadyStamps(prev => prev.filter(s => s.id !== stamp.id)); // If it was ready
        }
    };

    const handleAutoName = async () => {
        if (!designatingStamp) return;
        const name = await generateStampName({
            rarity: designatingStamp.rarity,
            material: 'none', // Not tracked in designation but visual
            style: 'standard',
            visualPrompt: designatingStamp.name
        });
        setDesignatingStamp({ ...designatingStamp, name });
    };

    const handlePidgeyFillDesignation = async () => {
        if (!designatingStamp) return;
        setIsFillingDesignation(true);
        const data = await generateFormContent('stamp_designation', { currentName: designatingStamp.name });
        if (data) {
            setDesignatingStamp(prev => ({
                ...prev!,
                name: data.name,
                collection: data.collection,
                price_eggs: data.price_eggs,
                edition_count: data.edition_count,
                rarity: Object.values(StampRarity).includes(data.rarity) ? data.rarity : prev!.rarity
            }));
        }
        setIsFillingDesignation(false);
    };

    const finalizeDesignation = async () => {
        if (!designatingStamp || !designatingStamp.id) return;
        
        // Basic Validation
        if (!designatingStamp.edition_count || designatingStamp.edition_count < 1) return alert("Please set a valid Edition Count.");
        if (!designatingStamp.name) return alert("Stamp Name is required.");

        // Update status to READY
        const payload = {
            ...designatingStamp,
            status: StampStatus.READY
        };

        const { error } = await AdminService.stamps.update(designatingStamp.id, payload);
        
        if (error) {
            alert("Failed to finalize: " + error.message);
        } else {
            // Update local state
            setInventoryStamps(prev => prev.map(s => s.id === designatingStamp.id ? { ...s, status: StampStatus.READY, name: designatingStamp.name, edition_count: designatingStamp.edition_count } : s));
            setIsDesignationOpen(false);
            
            // Explicit Success Feedback
            alert(`✅ Stamp "${designatingStamp.name}" is now READY!\n\nIt can now be selected when building a Drop Campaign.`);
        }
    };


    // --- Visual Helpers ---
    const getRarityColor = (r: StampRarity) => {
        switch(r) {
            case StampRarity.COMMON: return 'bg-slate-500 text-white';
            case StampRarity.RARE: return 'bg-blue-500 text-white';
            case StampRarity.LEGENDARY: return 'bg-yellow-500 text-yellow-900';
            case StampRarity.PIDGEY: return 'bg-purple-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStatusBadge = (status: StampStatus) => {
        switch(status) {
            case StampStatus.DRAFT: return <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 rounded uppercase font-bold border border-slate-600">Draft (Incomplete)</span>;
            case StampStatus.READY: return <span className="text-[9px] bg-green-500 text-pidgey-dark px-1.5 rounded uppercase font-bold flex items-center gap-1"><CheckCircle2 size={10}/> Ready</span>;
            case StampStatus.ACTIVE: return <span className="text-[9px] bg-purple-500 text-white px-1.5 rounded uppercase font-bold">Active</span>;
            default: return null;
        }
    }

    // Filter Logic
    const filteredStamps = inventoryStamps.filter(s => {
        if (inventoryFilter === 'all') return true;
        return s.status === inventoryFilter;
    });

    return (
        <div className="space-y-8">
            {/* Header with Tab Navigation */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pidgey-accent/10 rounded-lg text-pidgey-accent">
                            <Egg size={24} />
                        </div>
                        <h1 className="text-2xl font-bold">Drops & Stamps</h1>
                    </div>
                    
                    {/* View Switcher */}
                    <div className="flex bg-pidgey-panel border border-pidgey-border rounded-lg p-1">
                        <button 
                            onClick={() => setActiveView('campaigns')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition ${activeView === 'campaigns' ? 'bg-pidgey-dark text-white shadow-sm' : 'text-pidgey-muted hover:text-white'}`}
                        >
                            Campaigns
                        </button>
                        <button 
                            onClick={() => setActiveView('inventory')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition flex items-center gap-2 ${activeView === 'inventory' ? 'bg-pidgey-dark text-white shadow-sm' : 'text-pidgey-muted hover:text-white'}`}
                        >
                            Stamp Inventory <span className="bg-pidgey-accent text-pidgey-dark px-1.5 rounded-full text-[9px]">{inventoryStamps.length}</span>
                        </button>
                    </div>
                </div>

                {activeView === 'campaigns' && (
                    <button 
                        onClick={handleAddNewDrop}
                        className="flex items-center gap-2 px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition"
                    >
                        <Plus size={18} /> New Drop
                    </button>
                )}
            </div>

            {/* --- VIEW 1: CAMPAIGNS --- */}
            {activeView === 'campaigns' && (
                <section>
                    {loading ? (
                        <div className="flex items-center gap-2 text-pidgey-muted"><Loader className="animate-spin"/> Loading campaigns...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {drops.length === 0 && (
                                <div className="col-span-full border-2 border-dashed border-pidgey-border rounded-xl p-12 text-center text-pidgey-muted">
                                    <Egg size={48} className="mx-auto mb-4 opacity-20"/>
                                    <p>No active drops. Create one to get started.</p>
                                </div>
                            )}
                            {drops.map(drop => (
                                <div key={drop.id} className="group relative bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden hover:border-pidgey-accent transition-colors shadow-sm">
                                    {/* Banner */}
                                    <div className="h-32 bg-cover bg-center relative" style={{backgroundImage: `url(${drop.banner_path || 'https://via.placeholder.com/800x200'})`}}>
                                        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md shadow-sm ${
                                            drop.status === 'live' ? 'bg-green-500/80 text-white' : 
                                            drop.status === 'draft' ? 'bg-slate-500/80 text-white' : 'bg-red-500/80 text-white'
                                        }`}>
                                            {drop.status}
                                        </div>
                                        {/* Action Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={() => handleEditDrop(drop)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => drop.id && handleArchiveDrop(drop.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-200 backdrop-blur">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg leading-tight">{drop.title}</h3>
                                            <div className="text-right">
                                                 <span className="text-yellow-400 font-bold text-sm block whitespace-nowrap">{drop.egg_price} 🥚</span>
                                                 {drop.bundle_price && <span className="text-xs text-pidgey-muted whitespace-nowrap">Bundle: {drop.bundle_price} 🥚</span>}
                                            </div>
                                        </div>
                                        <p className="text-pidgey-muted text-sm mb-4 line-clamp-2">{drop.description}</p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-pidgey-muted pt-4 border-t border-pidgey-border">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span>Start: {new Date(drop.start_at).toLocaleDateString()}`</span>
                                            </div>
                                            {drop.max_supply && (
                                                <div className="flex items-center gap-1">
                                                    <Sparkles size={12} />
                                                    <span>Max: {drop.max_supply}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* --- VIEW 2: STAMP INVENTORY (DESIGNATION STUDIO) --- */}
            {activeView === 'inventory' && (
                <section>
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Box size={20} className="text-pidgey-accent" /> Stamp Inventory
                                </h2>
                                <p className="text-xs text-pidgey-muted">Manage stamps and finalize their supply/price for Drops.</p>
                            </div>
                            
                            {/* Filter Controls */}
                            <div className="flex gap-2 bg-pidgey-dark p-1 rounded-lg border border-pidgey-border">
                                <button 
                                    onClick={() => setInventoryFilter('all')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${inventoryFilter === 'all' ? 'bg-pidgey-panel text-white shadow-sm' : 'text-pidgey-muted hover:text-white'}`}
                                >
                                    All
                                </button>
                                <button 
                                    onClick={() => setInventoryFilter('draft')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors flex items-center gap-1 ${inventoryFilter === 'draft' ? 'bg-pidgey-panel text-white shadow-sm' : 'text-pidgey-muted hover:text-white'}`}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div> Action Needed
                                </button>
                                <button 
                                    onClick={() => setInventoryFilter('ready')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors flex items-center gap-1 ${inventoryFilter === 'ready' ? 'bg-green-500/20 text-green-400 shadow-sm' : 'text-pidgey-muted hover:text-green-400'}`}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Ready
                                </button>
                            </div>

                            <button onClick={fetchData} className="text-pidgey-muted hover:text-white ml-2"><Undo2 size={16}/></button>
                        </div>
                        
                        {loading ? (
                            <div className="py-12 text-center text-pidgey-muted">Loading inventory...</div>
                        ) : filteredStamps.length === 0 ? (
                            <div className="border-2 border-dashed border-pidgey-border rounded-xl p-12 text-center text-pidgey-muted">
                                <ImageIcon size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>No stamps found matching filter.</p>
                                <p className="text-xs mt-2">Go to Playground to create new assets.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {filteredStamps.map(stamp => (
                                    <div 
                                        key={stamp.id} 
                                        onClick={() => openDesignation(stamp)}
                                        className={`bg-pidgey-dark border rounded-xl p-3 cursor-pointer hover:-translate-y-1 transition-all group relative ${
                                            stamp.status === StampStatus.READY 
                                            ? 'border-green-500/30 hover:border-green-500' 
                                            : 'border-pidgey-border hover:border-pidgey-accent'
                                        }`}
                                    >
                                        <div className="aspect-[3/4] bg-pidgey-panel rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                                            {stamp.art_path ? <img src={stamp.art_path} className="w-full h-full object-contain p-2" /> : <ImageIcon size={24} className="opacity-20"/>}
                                            <div className="absolute inset-0 bg-pidgey-accent/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="bg-pidgey-accent text-pidgey-dark text-[10px] font-bold px-2 py-1 rounded shadow-lg">EDIT METADATA</span>
                                            </div>
                                            {stamp.status === StampStatus.READY && (
                                                <div className="absolute top-1 right-1 bg-green-500 text-pidgey-dark p-0.5 rounded-full shadow-md">
                                                    <CheckCircle2 size={10} />
                                                </div>
                                            )}
                                            {/* DELETE BUTTON */}
                                            <button 
                                                onClick={(e) => handleDeleteStamp(e, stamp)}
                                                className="absolute top-1 left-1 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 shadow-md"
                                                title="Delete Stamp"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div className="font-bold text-xs truncate text-white" title={stamp.name}>{stamp.name}</div>
                                        <div className="flex justify-between items-center mt-1">
                                             <span className={`text-[9px] px-1.5 rounded uppercase font-bold ${getRarityColor(stamp.rarity)}`}>{stamp.rarity}</span>
                                             {getStatusBadge(stamp.status)}
                                        </div>
                                        {stamp.edition_count ? (
                                             <div className="mt-1 text-[9px] text-pidgey-muted">Supply: {stamp.edition_count}</div>
                                        ) : (
                                            <div className="mt-1 text-[9px] text-red-400 font-bold animate-pulse">Set Supply!</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* --- MODAL: DESIGNATION STUDIO --- */}
            <DesignationModal 
                isOpen={isDesignationOpen}
                onClose={() => setIsDesignationOpen(false)}
                stamp={designatingStamp}
                onUpdate={(updates) => setDesignatingStamp(prev => prev ? { ...prev, ...updates } : null)}
                onSave={finalizeDesignation}
                onAutoName={handleAutoName}
                onPidgeyFill={handlePidgeyFillDesignation}
                isFilling={isFillingDesignation}
            />

            {/* --- MODAL: DROP CREATOR --- */}
            <DropCreatorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                drop={currentDrop}
                onUpdate={(updates) => setCurrentDrop(prev => ({ ...prev, ...updates }))}
                dropStamps={dropStamps}
                onToggleStamp={toggleStampSelection}
                readyStamps={readyStamps}
                onSave={handleSaveDrop}
                onPidgeyFill={handlePidgeyFillDrop}
                isFilling={isFillingDrop}
                onRevert={handleRevertToDraft}
                isStampSelectorOpen={isStampSelectorOpen}
                setIsStampSelectorOpen={setIsStampSelectorOpen}
            />
        </div>
    );
};
