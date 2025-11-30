
import React, { useState, useEffect, useRef } from 'react';
import { Egg, Sparkles, Plus, Edit, Trash2, X, Save, Calendar, Loader, Image as ImageIcon, AlertTriangle, Upload, Search, CheckCircle2, Library, History, Undo2, Tag, Box, ArrowRight, Palette, Filter } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Drop, DropStatus, Stamp, StampRarity, StampStatus, Asset } from '../types';
import { MOCK_STAMPS } from '../constants'; // Fallback for stamps if API fails
import { useJarvis } from '../JarvisContext';
import { generateStampName, generateFormContent } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

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
                                                <span>Start: {new Date(drop.start_at).toLocaleDateString()}</span>
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
                                        className={`bg-pidgey-dark border rounded-xl p-3 cursor-pointer hover:-translate-y-1 transition-all group ${
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
            {isDesignationOpen && designatingStamp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in zoom-in-95 duration-200">
                        {/* Left: Preview */}
                        <div className="w-full md:w-1/3 bg-pidgey-dark p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-pidgey-border relative flex-col gap-4">
                            <div className="relative w-full aspect-[3/4] bg-pidgey-panel rounded-xl flex items-center justify-center shadow-2xl border-4 border-dotted border-pidgey-border">
                                <img src={designatingStamp.art_path} className="w-full h-full object-contain p-4" />
                                {/* Overlay Stats */}
                                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur rounded p-2 text-center">
                                    <div className="text-white font-bold text-sm">{designatingStamp.name}</div>
                                    <div className={`text-[10px] uppercase font-bold mt-1 inline-block px-2 rounded ${getRarityColor(designatingStamp.rarity)}`}>{designatingStamp.rarity}</div>
                                </div>
                            </div>
                            
                            {/* Playground Bridge */}
                            <button 
                                onClick={() => navigate('/playground', { state: { loadStamp: designatingStamp } })}
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
                                            onClick={handlePidgeyFillDesignation}
                                            disabled={isFillingDesignation}
                                            className="text-xs flex items-center gap-1 text-pidgey-accent bg-pidgey-accent/10 hover:bg-pidgey-accent/20 px-2 py-1 rounded transition ml-2"
                                        >
                                            <Sparkles size={12} className={isFillingDesignation ? "animate-spin" : ""} />
                                            Pidgey Fill
                                        </button>
                                    </h2>
                                    <p className="text-xs text-pidgey-muted">Define metadata to finalize this asset.</p>
                                </div>
                                <button onClick={() => setIsDesignationOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Official Name</label>
                                    <div className="relative">
                                        <input 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-white focus:border-pidgey-accent outline-none font-bold"
                                            value={designatingStamp.name}
                                            onChange={e => setDesignatingStamp({...designatingStamp, name: e.target.value})}
                                        />
                                        <button 
                                            onClick={handleAutoName}
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
                                            value={designatingStamp.rarity}
                                            onChange={e => setDesignatingStamp({...designatingStamp, rarity: e.target.value as StampRarity})}
                                        >
                                            {Object.values(StampRarity).map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Collection Tag</label>
                                        <input 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white outline-none"
                                            value={designatingStamp.collection || ''}
                                            onChange={e => setDesignatingStamp({...designatingStamp, collection: e.target.value})}
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
                                                value={designatingStamp.edition_count || ''}
                                                onChange={e => setDesignatingStamp({...designatingStamp, edition_count: parseInt(e.target.value)})}
                                                placeholder="Total Supply"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-pidgey-muted uppercase mb-1">Base Price (Eggs)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-pidgey-panel border border-pidgey-border rounded p-2 text-white outline-none"
                                                value={designatingStamp.price_eggs || 0}
                                                onChange={e => setDesignatingStamp({...designatingStamp, price_eggs: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id="dropOnly"
                                            checked={designatingStamp.is_drop_only}
                                            onChange={e => setDesignatingStamp({...designatingStamp, is_drop_only: e.target.checked})}
                                            className="rounded border-pidgey-border bg-pidgey-panel text-pidgey-accent"
                                        />
                                        <label htmlFor="dropOnly" className="text-xs text-pidgey-muted cursor-pointer select-none">Drop Exclusive (Cannot be bought in store)</label>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-pidgey-border flex justify-end gap-3">
                                    <button onClick={() => setIsDesignationOpen(false)} className="px-4 py-2 text-sm font-bold text-pidgey-muted hover:text-white transition">Cancel</button>
                                    <button 
                                        onClick={finalizeDesignation}
                                        className="px-6 py-2 bg-gradient-to-r from-pidgey-accent to-pidgey-secondary text-pidgey-dark font-bold rounded-lg hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
                                    >
                                        <CheckCircle2 size={18} /> Finalize & Ready
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: DROP CREATOR --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden relative">
                        {/* ... (Same as existing Drop Creator) ... */}
                        {/* Header */}
                        <div className="p-6 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {currentDrop.id ? 'Edit Campaign' : 'New Drop Campaign'}
                                    {draftPayload && <span className="text-xs bg-pidgey-accent/20 text-pidgey-accent px-2 py-0.5 rounded-full">AI Draft</span>}
                                    <button 
                                        onClick={handlePidgeyFillDrop}
                                        disabled={isFillingDrop}
                                        className="text-xs flex items-center gap-1 text-pidgey-accent bg-pidgey-accent/10 hover:bg-pidgey-accent/20 px-2 py-1 rounded transition ml-2 border border-pidgey-accent/30"
                                    >
                                        <Sparkles size={12} className={isFillingDrop ? "animate-spin" : ""} />
                                        Auto-Fill with Pidgey
                                    </button>
                                </h2>
                                <p className="text-xs text-pidgey-muted">Configure campaign details and select assets.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="text-pidgey-muted hover:text-white px-3">Cancel</button>
                                <button onClick={handleSaveDrop} className="px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg flex items-center gap-2 hover:bg-teal-300">
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
                                            value={currentDrop.title || ''}
                                            onChange={e => setCurrentDrop({...currentDrop, title: e.target.value})}
                                            placeholder="e.g. Winter Wonderland"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Single Price</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                                value={currentDrop.egg_price || 0}
                                                onChange={e => setCurrentDrop({...currentDrop, egg_price: parseInt(e.target.value)})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Bundle Price</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                                value={currentDrop.bundle_price || ''}
                                                onChange={e => setCurrentDrop({...currentDrop, bundle_price: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Schedule</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                type="date"
                                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2 text-xs text-white"
                                                value={currentDrop.start_at ? currentDrop.start_at.split('T')[0] : ''}
                                                onChange={e => setCurrentDrop({...currentDrop, start_at: new Date(e.target.value).toISOString()})}
                                            />
                                            <input 
                                                type="date"
                                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2 text-xs text-white"
                                                value={currentDrop.end_at ? currentDrop.end_at.split('T')[0] : ''}
                                                onChange={e => setCurrentDrop({...currentDrop, end_at: new Date(e.target.value).toISOString()})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Status</label>
                                        <select 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                            value={currentDrop.status || 'draft'}
                                            onChange={e => setCurrentDrop({...currentDrop, status: e.target.value as DropStatus})}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="live">Live</option>
                                            <option value="ended">Ended</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Stamp Selector (The "Point and Click" Interface) */}
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
                                                    onClick={() => toggleStampSelection(stamp as Stamp)}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <div className="aspect-[3/4] bg-pidgey-panel rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                                    <img src={stamp.art_path} className="w-full h-full object-contain p-2" />
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
                                                                onClick={() => toggleStampSelection(stamp)}
                                                                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                                                                    isSelected 
                                                                    ? 'bg-pidgey-accent/10 border-pidgey-accent ring-1 ring-pidgey-accent' 
                                                                    : 'bg-pidgey-dark border-pidgey-border hover:border-pidgey-muted'
                                                                }`}
                                                            >
                                                                <div className="aspect-[3/4] bg-black/20 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                                                                    <img src={stamp.art_path} className="w-full h-full object-contain p-2" />
                                                                    {isSelected && (
                                                                        <div className="absolute inset-0 bg-pidgey-accent/20 flex items-center justify-center">
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
            )}
        </div>
    );
};
