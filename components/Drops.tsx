
import React, { useState, useEffect, useRef } from 'react';
import { Egg, Sparkles, Plus, Edit, Trash2, X, Save, Calendar, Loader, Image as ImageIcon, AlertTriangle, Upload, Search, CheckCircle2, Library } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Drop, DropStatus, Stamp, StampRarity, StampStatus, Asset } from '../types';
import { MOCK_STAMPS } from '../constants'; // Fallback for stamps if API fails
import { useJarvis } from '../JarvisContext';

export const Drops = () => {
    const [drops, setDrops] = useState<Drop[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Drop State
    const [currentDrop, setCurrentDrop] = useState<Partial<Drop>>({});
    
    // Stamp Builder State (Stamps inside the current drop)
    const [dropStamps, setDropStamps] = useState<Partial<Stamp>[]>([]);
    
    // Asset Picker State
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [libraryAssets, setLibraryAssets] = useState<Asset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [pickingSlotIndex, setPickingSlotIndex] = useState<number | null>(null);
    const [assetSearch, setAssetSearch] = useState('');
    
    // Context for Pidgey's Drafts
    const { draftPayload, setDraftPayload } = useJarvis();

    // Check for drafts on mount or when payload changes
    useEffect(() => {
        if (draftPayload && draftPayload.type === 'DRAFT_DROP') {
            console.log("Received draft drop from Pidgey:", draftPayload.data);
            setCurrentDrop(draftPayload.data);
            // Pidgey might send initial stamps, otherwise default to 3 empty slots
            setDropStamps(draftPayload.data.stamps || [
                { name: 'Stamp 1', rarity: StampRarity.COMMON, status: StampStatus.ACTIVE },
                { name: 'Stamp 2', rarity: StampRarity.COMMON, status: StampStatus.ACTIVE },
                { name: 'Stamp 3', rarity: StampRarity.RARE, status: StampStatus.ACTIVE }
            ]);
            setIsModalOpen(true);
            setDraftPayload(null); // Clear after consuming
        }
    }, [draftPayload, setDraftPayload]);
    
    // Fetch Data
    useEffect(() => {
        fetchDrops();
    }, []);

    const fetchDrops = async () => {
        setLoading(true);
        const { data, error } = await AdminService.drops.list();
        if (!error) setDrops(data);
        setLoading(false);
    };

    // Handlers
    const handleAddNew = () => {
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
        // Start with 3 blank templates
        setDropStamps([
            { name: '', rarity: StampRarity.COMMON, status: StampStatus.ACTIVE, art_path: '' },
            { name: '', rarity: StampRarity.COMMON, status: StampStatus.ACTIVE, art_path: '' },
            { name: '', rarity: StampRarity.RARE, status: StampStatus.ACTIVE, art_path: '' }
        ]);
        setIsModalOpen(true);
    };

    const handleEdit = (drop: Drop) => {
        setCurrentDrop({ ...drop });
        // In a real app, we would fetch the stamps linked to this drop here
        // For now, we mock it by filtering MOCK_STAMPS or creating dummies
        setDropStamps([
            { name: 'Existing Stamp 1', rarity: StampRarity.COMMON, status: StampStatus.ACTIVE, art_path: 'https://picsum.photos/seed/s1/200' },
            { name: 'Existing Stamp 2', rarity: StampRarity.LEGENDARY, status: StampStatus.ACTIVE, art_path: 'https://picsum.photos/seed/s2/200' }
        ]);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentDrop.title || !currentDrop.egg_price) return alert("Title and Price required");
        
        // Attach the built stamps to the drop payload for the backend to handle
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
            alert("Error saving drop: " + res.error.message + "\n\nTip: Go to Settings > Database to create the missing tables if this is a new setup.");
        } else {
            setIsModalOpen(false);
            fetchDrops();
        }
    };

    const handleArchive = async (id: string) => {
        if (!confirm("Are you sure you want to end this drop?")) return;
        await AdminService.drops.archive(id);
        fetchDrops();
    };

    // --- Stamp Builder Handlers ---

    const addStampSlot = () => {
        if (dropStamps.length >= 10) return alert("Max 10 stamps per drop.");
        setDropStamps([...dropStamps, { name: '', rarity: StampRarity.COMMON, status: StampStatus.ACTIVE, art_path: '' }]);
    };

    const removeStampSlot = (index: number) => {
        const newStamps = [...dropStamps];
        newStamps.splice(index, 1);
        setDropStamps(newStamps);
    };

    const updateStampSlot = (index: number, field: keyof Stamp, value: any) => {
        const newStamps = [...dropStamps];
        newStamps[index] = { ...newStamps[index], [field]: value };
        setDropStamps(newStamps);
    };

    // Open the Asset Picker
    // If index is null, it means we are adding a NEW slot from the library
    const openAssetPicker = async (index: number | null) => {
        setPickingSlotIndex(index);
        setIsAssetPickerOpen(true);
        setLoadingAssets(true);
        // Fetch from 'stamps' bucket
        const { data } = await AdminService.files.list('stamps');
        setLibraryAssets(data);
        setLoadingAssets(false);
    };

    const selectAssetForSlot = (asset: Asset) => {
        // Clean up name from filename
        const cleanName = asset.name.split('/').pop()?.split('.')[0].replace(/_/g, ' ') || 'New Stamp';
        const titleCaseName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

        if (pickingSlotIndex === null) {
            // Create a NEW slot with this asset
            if (dropStamps.length >= 10) {
                alert("Max 10 stamps per drop.");
                return;
            }
            setDropStamps([...dropStamps, { 
                name: titleCaseName, 
                rarity: StampRarity.COMMON, 
                status: StampStatus.ACTIVE, 
                art_path: asset.url 
            }]);
        } else {
            // Update EXISTING slot
            const newStamps = [...dropStamps];
            newStamps[pickingSlotIndex] = { 
                ...newStamps[pickingSlotIndex], 
                art_path: asset.url,
                name: newStamps[pickingSlotIndex].name || titleCaseName // Only overwrite name if empty or default
            };
            setDropStamps(newStamps);
        }
        
        setIsAssetPickerOpen(false);
        setPickingSlotIndex(null);
    };

    // --- Visual Stylers ---

    const getStampStyle = (rarity: StampRarity | undefined) => {
        // Base stamp style: Padded, Rounded, Transition
        let classes = "bg-pidgey-dark rounded-xl p-4 relative group transition-all duration-300 ease-out ";
        
        // Perforated Border Effect using dashed border + specific colors/shadows
        switch(rarity) {
            case StampRarity.RARE: 
                // Blue Glow
                return classes + "border-[6px] border-dotted border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]";
            case StampRarity.LEGENDARY: 
                // Gold Glow
                return classes + "border-[6px] border-dotted border-yellow-500/60 shadow-[0_0_25px_-5px_rgba(234,179,8,0.6)] hover:shadow-[0_0_40px_rgba(234,179,8,0.8)] ring-1 ring-yellow-400/30";
            case StampRarity.PIDGEY: 
                // Purple Pulse
                return classes + "border-[6px] border-dotted border-purple-500/60 shadow-[0_0_30px_-5px_rgba(168,85,247,0.7)] hover:shadow-[0_0_50px_rgba(168,85,247,0.9)] ring-1 ring-purple-400/30 animate-pulse-slow";
            default: 
                // Common (Slate)
                return classes + "border-[6px] border-dotted border-pidgey-border hover:border-slate-500 hover:shadow-lg";
        }
    };

    const filteredAssets = libraryAssets.filter(a => a.name.toLowerCase().includes(assetSearch.toLowerCase()));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pidgey-accent/10 rounded-lg text-pidgey-accent">
                        <Egg size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Drops & Stamps</h1>
                </div>
                <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition"
                >
                    <Plus size={18} /> New Drop
                </button>
            </div>

            {/* Active Drops Grid */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-pidgey-muted text-sm font-semibold uppercase tracking-wider">
                    <span>Active & Upcoming</span>
                    <span className="bg-pidgey-border px-2 py-0.5 rounded-full text-xs text-white">{drops.length}</span>
                </div>
                
                {loading ? (
                    <div className="flex items-center gap-2 text-pidgey-muted"><Loader className="animate-spin"/> Loading drops...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                                        <button onClick={() => handleEdit(drop)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => drop.id && handleArchive(drop.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-200 backdrop-blur">
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

            {/* Stamp Library (Visual Only for now, mocking data access) */}
            <section className="pt-8 border-t border-pidgey-border">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Recent Stamps</h2>
                    <button className="text-sm text-pidgey-accent hover:underline">View All Library</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {MOCK_STAMPS.map(stamp => (
                        <div key={stamp.id} className="bg-pidgey-panel border-4 border-dotted border-pidgey-border rounded-lg p-3 text-center hover:-translate-y-1 transition-transform cursor-pointer">
                            <div className="w-full aspect-[3/4] rounded bg-pidgey-dark mb-3 overflow-hidden flex items-center justify-center p-2">
                                <img src={stamp.art_path} alt={stamp.name} className="w-full h-full object-contain" />
                            </div>
                            <p className="font-medium text-sm truncate">{stamp.name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full mt-2 inline-block font-bold uppercase ${
                                stamp.rarity === StampRarity.LEGENDARY ? 'bg-yellow-500/20 text-yellow-400' :
                                stamp.rarity === StampRarity.PIDGEY ? 'bg-pidgey-secondary/20 text-pidgey-secondary' :
                                'bg-slate-700 text-slate-300'
                            }`}>
                                {stamp.rarity}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Create/Edit Modal - WIDE MODE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden relative">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {currentDrop.id ? 'Edit Drop' : 'Create New Drop'}
                                    {draftPayload && <span className="text-xs bg-pidgey-accent/20 text-pidgey-accent px-2 py-0.5 rounded-full">AI Draft</span>}
                                </h2>
                                <p className="text-xs text-pidgey-muted">Configure your drop details and stamp assets.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="text-pidgey-muted hover:text-white px-3">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg flex items-center gap-2 hover:bg-teal-300">
                                    <Save size={16} /> Save Drop
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            {/* LEFT COLUMN: Drop Config */}
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

                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Status</label>
                                        <select 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                            value={currentDrop.status || 'draft'}
                                            onChange={e => setCurrentDrop({...currentDrop, status: e.target.value as DropStatus})}
                                        >
                                            <option value="draft">Draft (Hidden)</option>
                                            <option value="live">Live (Public)</option>
                                            <option value="ended">Ended</option>
                                        </select>
                                    </div>
                                    
                                    {/* Pricing Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Single Stamp Price</label>
                                            <input 
                                                type="number"
                                                min="1"
                                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                                value={currentDrop.egg_price || 0}
                                                onChange={e => setCurrentDrop({...currentDrop, egg_price: parseInt(e.target.value)})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Full Book Price</label>
                                            <input 
                                                type="number"
                                                min="1"
                                                placeholder="Optional"
                                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                                value={currentDrop.bundle_price || ''}
                                                onChange={e => setCurrentDrop({...currentDrop, bundle_price: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Edition Limit (Max Supply)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                            value={currentDrop.max_supply || 0}
                                            onChange={e => setCurrentDrop({...currentDrop, max_supply: parseInt(e.target.value)})}
                                            placeholder="Unlimited"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Dates</label>
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
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Description</label>
                                        <textarea 
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none h-24 text-sm"
                                            value={currentDrop.description || ''}
                                            onChange={e => setCurrentDrop({...currentDrop, description: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Stamp Builder */}
                            <div className="w-2/3 p-6 overflow-y-auto bg-pidgey-panel">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Stamp Template Manager</h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openAssetPicker(null)} 
                                            className="text-xs bg-pidgey-secondary text-white border border-pidgey-secondary px-3 py-1.5 rounded flex items-center gap-2 transition hover:bg-purple-600"
                                        >
                                            <Library size={14} /> Add from Library
                                        </button>
                                        <button 
                                            onClick={addStampSlot} 
                                            className="text-xs bg-pidgey-dark hover:bg-pidgey-border border border-pidgey-border px-3 py-1.5 rounded flex items-center gap-2 transition"
                                        >
                                            <Plus size={14} /> Add Empty Slot
                                        </button>
                                    </div>
                                </div>

                                {dropStamps.length === 0 ? (
                                    <div className="border-2 border-dashed border-pidgey-border rounded-xl h-64 flex flex-col items-center justify-center text-pidgey-muted gap-2">
                                        <Egg size={40} className="opacity-20" />
                                        <p>No stamps in this drop yet.</p>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => openAssetPicker(null)} className="text-pidgey-secondary hover:underline text-sm font-bold">Pick from Library</button>
                                            <span>or</span>
                                            <button onClick={addStampSlot} className="text-pidgey-accent hover:underline text-sm font-bold">Create Blank Slot</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                                        {dropStamps.map((stamp, idx) => (
                                            <div key={idx} className={getStampStyle(stamp.rarity)}>
                                                
                                                {/* Remove Button */}
                                                <button onClick={() => removeStampSlot(idx)} className="absolute top-2 right-2 p-1.5 bg-pidgey-panel hover:bg-red-500/20 hover:text-red-400 rounded-full text-pidgey-muted transition opacity-0 group-hover:opacity-100 z-10">
                                                    <X size={14} />
                                                </button>

                                                {/* Art Placeholder - Oblong 3:4 */}
                                                <div 
                                                    onClick={() => openAssetPicker(idx)}
                                                    className="aspect-[3/4] bg-pidgey-panel rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group/image cursor-pointer hover:bg-pidgey-border transition-colors border border-transparent hover:border-pidgey-accent"
                                                >
                                                    {stamp.art_path ? (
                                                        <img src={stamp.art_path} className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <div className="flex flex-col items-center text-pidgey-muted/50">
                                                            <ImageIcon size={32} />
                                                            <span className="text-[10px] uppercase font-bold mt-1 text-center">Select Asset</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Upload Overlay */}
                                                    {stamp.art_path && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                                            <span className="text-xs font-bold text-white border border-white/50 px-2 py-1 rounded flex items-center gap-2">
                                                                <Edit size={12}/> Change Art
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Controls */}
                                                <div className="space-y-2">
                                                    <input 
                                                        className="w-full bg-transparent border-b border-pidgey-border text-sm font-bold text-center focus:border-pidgey-accent outline-none py-1"
                                                        placeholder="Stamp Name"
                                                        value={stamp.name}
                                                        onChange={(e) => updateStampSlot(idx, 'name', e.target.value)}
                                                    />
                                                    
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase">Rarity</label>
                                                        <select 
                                                            className="bg-pidgey-panel text-[10px] text-white border border-pidgey-border rounded px-1 py-0.5 outline-none"
                                                            value={stamp.rarity}
                                                            onChange={(e) => updateStampSlot(idx, 'rarity', e.target.value)}
                                                        >
                                                            {Object.values(StampRarity).map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Rarity Indicator Badge */}
                                                <div className="absolute top-2 left-2 pointer-events-none">
                                                     <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-black/50 backdrop-blur text-white border border-white/10 shadow-sm`}>
                                                        {stamp.rarity}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Quick Add Button at end of grid */}
                                        {dropStamps.length < 10 && (
                                            <button onClick={addStampSlot} className="border-4 border-dashed border-pidgey-border rounded-xl flex flex-col items-center justify-center text-pidgey-muted hover:border-pidgey-accent hover:text-pidgey-accent transition-colors min-h-[300px]">
                                                <Plus size={24} />
                                                <span className="text-xs font-bold mt-2">Add Slot</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ASSET LIBRARY PICKER MODAL (Layered) */}
                        {isAssetPickerOpen && (
                            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
                                <div className="bg-pidgey-panel border border-pidgey-border w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                                    <div className="p-4 border-b border-pidgey-border bg-pidgey-dark flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg">Select Stamp Asset</h3>
                                            <p className="text-xs text-pidgey-muted">Choose art from your Stamps bucket</p>
                                        </div>
                                        <button onClick={() => setIsAssetPickerOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    
                                    <div className="p-4 border-b border-pidgey-border bg-pidgey-panel flex gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Search assets..." 
                                                value={assetSearch}
                                                onChange={(e) => setAssetSearch(e.target.value)}
                                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-pidgey-accent text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 bg-pidgey-dark/50">
                                        {loadingAssets ? (
                                            <div className="flex justify-center items-center h-full text-pidgey-muted">
                                                <Loader className="animate-spin mr-2" /> Loading Library...
                                            </div>
                                        ) : filteredAssets.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-pidgey-muted opacity-50">
                                                <ImageIcon size={48} className="mb-4" />
                                                <p>No assets found in 'stamps' bucket.</p>
                                                <p className="text-xs">Go to Files to upload new art.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                                {filteredAssets.map(asset => (
                                                    <div 
                                                        key={asset.id}
                                                        onClick={() => selectAssetForSlot(asset)}
                                                        className="aspect-[3/4] bg-pidgey-panel border border-pidgey-border rounded-xl cursor-pointer hover:border-pidgey-accent hover:ring-2 hover:ring-pidgey-accent/50 transition-all flex flex-col overflow-hidden group"
                                                    >
                                                        <div className="flex-1 p-2 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="p-2 bg-pidgey-dark border-t border-pidgey-border text-center">
                                                            <p className="text-[10px] font-bold truncate text-pidgey-text group-hover:text-pidgey-accent">{asset.name}</p>
                                                        </div>
                                                        
                                                        {/* Selected Indicator (Hover) */}
                                                        <div className="absolute inset-0 bg-pidgey-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                            <div className="bg-pidgey-accent text-pidgey-dark rounded-full p-2 shadow-lg">
                                                                <CheckCircle2 size={24} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
