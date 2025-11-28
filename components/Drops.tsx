
import React, { useState, useEffect } from 'react';
import { Egg, Sparkles, Plus, Edit, Trash2, X, Save, Calendar, Loader, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Drop, DropStatus, Stamp, StampRarity, StampStatus } from '../types';
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
            alert("Error saving drop: " + res.error.message);
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

    const getRarityColor = (rarity: StampRarity | undefined) => {
        switch(rarity) {
            case StampRarity.COMMON: return 'border-slate-500 text-slate-400';
            case StampRarity.RARE: return 'border-blue-500 text-blue-400';
            case StampRarity.LEGENDARY: return 'border-yellow-500 text-yellow-400';
            case StampRarity.PIDGEY: return 'border-pidgey-secondary text-pidgey-secondary';
            default: return 'border-slate-600';
        }
    };

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
                        <div key={stamp.id} className="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 text-center hover:-translate-y-1 transition-transform cursor-pointer">
                            <div className="w-full aspect-square rounded bg-pidgey-dark mb-3 overflow-hidden flex items-center justify-center">
                                <img src={stamp.art_path} alt={stamp.name} className="w-full h-full object-cover" />
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
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                        
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
                                    <button onClick={addStampSlot} className="text-xs bg-pidgey-dark hover:bg-pidgey-border border border-pidgey-border px-3 py-1.5 rounded flex items-center gap-2 transition">
                                        <Plus size={14} /> Add Template Slot
                                    </button>
                                </div>

                                {dropStamps.length === 0 ? (
                                    <div className="border-2 border-dashed border-pidgey-border rounded-xl h-64 flex flex-col items-center justify-center text-pidgey-muted gap-2">
                                        <Egg size={40} className="opacity-20" />
                                        <p>No stamps in this drop yet.</p>
                                        <button onClick={addStampSlot} className="text-pidgey-accent hover:underline text-sm">Add your first stamp</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                                        {dropStamps.map((stamp, idx) => (
                                            <div key={idx} className={`bg-pidgey-dark border-2 rounded-xl p-4 relative group transition-colors ${getRarityColor(stamp.rarity)}`}>
                                                
                                                {/* Remove Button */}
                                                <button onClick={() => removeStampSlot(idx)} className="absolute top-2 right-2 p-1.5 bg-pidgey-panel hover:bg-red-500/20 hover:text-red-400 rounded-full text-pidgey-muted transition opacity-0 group-hover:opacity-100 z-10">
                                                    <X size={14} />
                                                </button>

                                                {/* Art Placeholder */}
                                                <div className="aspect-square bg-pidgey-panel rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group/image">
                                                    {stamp.art_path ? (
                                                        <img src={stamp.art_path} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center text-pidgey-muted/50">
                                                            <ImageIcon size={32} />
                                                            <span className="text-[10px] uppercase font-bold mt-1">Empty Template</span>
                                                        </div>
                                                    )}
                                                    {/* Upload Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer">
                                                        <span className="text-xs font-bold text-white border border-white/50 px-2 py-1 rounded">Upload Art</span>
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="space-y-2">
                                                    <input 
                                                        className="w-full bg-transparent border-b border-pidgey-border text-sm font-bold text-center focus:border-pidgey-accent outline-none py-1"
                                                        placeholder="Stamp Name"
                                                        value={stamp.name}
                                                        onChange={(e) => updateStampSlot(idx, 'name', e.target.value)}
                                                    />
                                                    
                                                    <div className="flex justify-between items-center">
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
                                                <div className="absolute top-2 left-2">
                                                     <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-pidgey-dark/80 backdrop-blur border border-white/10`}>
                                                        {stamp.rarity}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Quick Add Button at end of grid */}
                                        {dropStamps.length < 10 && (
                                            <button onClick={addStampSlot} className="border-2 border-dashed border-pidgey-border rounded-xl flex flex-col items-center justify-center text-pidgey-muted hover:border-pidgey-accent hover:text-pidgey-accent transition-colors min-h-[250px]">
                                                <Plus size={24} />
                                                <span className="text-xs font-bold mt-2">Add Slot</span>
                                            </button>
                                        )}
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
