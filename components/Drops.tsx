
import React, { useState, useEffect } from 'react';
import { Egg, Plus, Edit, Trash2, Calendar, Loader, Sparkles, Box, LayoutGrid } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Drop, DropStatus, Stamp, StampRarity, StampStatus } from '../types';
import { useJarvis } from '../JarvisContext';
import { generateStampName, generateFormContent } from '../services/geminiService';
import { DesignationModal } from './drops/DesignationModal';
import { DropCreatorModal } from './drops/DropCreatorModal';
import { InventoryView } from './drops/InventoryView';

export const Drops = () => {
    // View State: 'campaigns' or 'inventory' (Designation Studio)
    const [activeView, setActiveView] = useState<'campaigns' | 'inventory'>('campaigns');
    
    // Campaign Data
    const [drops, setDrops] = useState<Drop[]>([]);
    
    // Inventory Data (All Stamps for Management)
    const [allStamps, setAllStamps] = useState<Stamp[]>([]);
    const [readyStamps, setReadyStamps] = useState<Stamp[]>([]); // Subset for Drop Selector
    
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
    const [isSavingDesignation, setIsSavingDesignation] = useState(false);
    
    // AI Filling States
    const [isFillingDrop, setIsFillingDrop] = useState(false);
    const [isFillingDesignation, setIsFillingDesignation] = useState(false);

    // Context for Pidgey's Drafts
    const { draftPayload, setDraftPayload } = useJarvis();

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
            // Fetch ALL stamps for Inventory View
            const { data, error } = await AdminService.stamps.list();
            if (!error) {
                // In Inventory View, we show everything so admins can manage the full lifecycle
                setAllStamps(data);
                
                // For Drop Selector: Only READY
                setReadyStamps(data.filter(s => s.status === StampStatus.READY || s.status === StampStatus.ACTIVE));
            }
        }
        setLoading(false);
    };

    // Load Ready stamps for Drop Creator
    const loadReadyStamps = async () => {
         const { data, error } = await AdminService.stamps.list();
         if (!error) {
             setReadyStamps(data.filter(s => s.status === StampStatus.READY || s.status === StampStatus.ACTIVE));
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
            setAllStamps(prev => prev.filter(s => s.id !== stamp.id));
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
        if (!designatingStamp || !designatingStamp.id) {
            console.error("Designation failed: Missing stamp ID", designatingStamp);
            alert("Error: Stamp ID missing. Cannot save.");
            return;
        }
        
        setIsSavingDesignation(true);

        // Basic Validation
        if (!designatingStamp.edition_count || designatingStamp.edition_count < 1) {
            setIsSavingDesignation(false);
            return alert("Please set a valid Edition Count.");
        }
        if (!designatingStamp.name) {
            setIsSavingDesignation(false);
            return alert("Stamp Name is required.");
        }

        // Sanitize Payload: Remove ID and created_at from body
        const { id, created_at, ...rest } = designatingStamp;
        const payload = {
            ...rest,
            status: StampStatus.READY,
            // Ensure numbers are numbers
            price_eggs: Number(designatingStamp.price_eggs) || 0,
            edition_count: Number(designatingStamp.edition_count) || 0
        };

        console.log("Saving stamp update:", id, payload);

        const { error } = await AdminService.stamps.update(designatingStamp.id, payload);
        
        setIsSavingDesignation(false);

        if (error) {
            alert("Failed to finalize: " + error.message);
        } else {
            // Update local state
            setAllStamps(prev => prev.map(s => s.id === designatingStamp.id ? { ...s, ...payload } : s));
            setIsDesignationOpen(false);
            
            // Explicit Success Feedback
            alert(`✅ Stamp "${designatingStamp.name}" is now READY!\n\nIt can now be selected when building a Drop Campaign.`);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header with Tab Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                         <div className="p-2 bg-gradient-to-br from-pidgey-accent to-pidgey-secondary rounded-xl text-pidgey-dark shadow-lg">
                            <Egg size={24} />
                        </div>
                        Drops & Stamps
                    </h1>
                    <p className="text-xs text-pidgey-muted mt-1 ml-14">Manage campaigns and organize your asset inventory.</p>
                </div>
                
                <div className="flex bg-pidgey-panel border border-pidgey-border rounded-xl p-1.5 shadow-md">
                    <button 
                        onClick={() => setActiveView('campaigns')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 ${
                            activeView === 'campaigns' 
                            ? 'bg-pidgey-dark text-white shadow-sm ring-1 ring-pidgey-border' 
                            : 'text-pidgey-muted hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <LayoutGrid size={14} /> Drop Campaigns
                    </button>
                    <button 
                        onClick={() => setActiveView('inventory')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 ${
                            activeView === 'inventory' 
                            ? 'bg-pidgey-dark text-white shadow-sm ring-1 ring-pidgey-border' 
                            : 'text-pidgey-muted hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Box size={14} /> Stamp Library
                    </button>
                </div>

                {activeView === 'campaigns' && (
                    <button 
                        onClick={handleAddNewDrop}
                        className="flex items-center gap-2 px-5 py-2.5 bg-pidgey-accent text-pidgey-dark font-bold rounded-xl hover:bg-teal-300 transition shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={18} /> New Campaign
                    </button>
                )}
            </div>

            {/* --- VIEW 1: CAMPAIGNS --- */}
            {activeView === 'campaigns' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-pidgey-muted gap-4">
                            <Loader className="animate-spin text-pidgey-accent" size={32}/> 
                            <span>Loading campaigns...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {drops.length === 0 && (
                                <div className="col-span-full border-2 border-dashed border-pidgey-border rounded-2xl p-16 text-center text-pidgey-muted bg-pidgey-panel/30">
                                    <Egg size={48} className="mx-auto mb-4 opacity-20"/>
                                    <h3 className="text-lg font-bold mb-1">No Active Drops</h3>
                                    <p className="text-sm">Create a new campaign to start selling stamps.</p>
                                </div>
                            )}
                            {drops.map(drop => (
                                <div key={drop.id} className="group relative bg-pidgey-panel border border-pidgey-border rounded-2xl overflow-hidden hover:border-pidgey-accent transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                                    {/* Banner */}
                                    <div className="h-40 bg-cover bg-center relative" style={{backgroundImage: `url(${drop.banner_path || 'https://via.placeholder.com/800x200'})`}}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        
                                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md shadow-sm border border-white/10 ${
                                            drop.status === 'live' ? 'bg-green-500/80 text-white' : 
                                            drop.status === 'draft' ? 'bg-slate-500/80 text-white' : 'bg-red-500/80 text-white'
                                        }`}>
                                            {drop.status}
                                        </div>

                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="font-bold text-xl text-white leading-tight mb-1">{drop.title}</h3>
                                            <div className="flex items-center gap-4 text-xs text-gray-300">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>{new Date(drop.start_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                                                    <Egg size={12} />
                                                    <span>{drop.egg_price} Eggs</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Action Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                            <button onClick={() => handleEditDrop(drop)} className="px-4 py-2 bg-white text-pidgey-dark rounded-full font-bold text-xs flex items-center gap-2 hover:bg-gray-100 transition">
                                                <Edit size={14} /> Edit
                                            </button>
                                            <button onClick={() => drop.id && handleArchiveDrop(drop.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Content Footer */}
                                    <div className="p-4 bg-pidgey-dark border-t border-pidgey-border">
                                        <p className="text-pidgey-muted text-xs line-clamp-2">{drop.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* --- VIEW 2: STAMP INVENTORY (DESIGNATION STUDIO) --- */}
            {activeView === 'inventory' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <InventoryView 
                        stamps={allStamps} 
                        loading={loading}
                        onSelectStamp={openDesignation}
                        onDeleteStamp={handleDeleteStamp}
                        onRefresh={fetchData}
                    />
                </div>
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
                isSaving={isSavingDesignation}
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
