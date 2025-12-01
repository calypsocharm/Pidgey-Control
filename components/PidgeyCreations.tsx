
import React, { useState } from 'react';
import { Bird, CheckCircle, XCircle, Clock, Sparkles, ArrowRight, Trash2, Image as ImageIcon, AlertTriangle, ExternalLink, Save, Tag, Egg, Box, MapPin } from 'lucide-react';
import { useJarvis } from '../JarvisContext';
import { AdminService } from '../services/adminService';
import { CreationDraft, StampRarity, StampStatus, DropStatus, BroadcastStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { generateFormContent } from '../services/geminiService';

// Helper to remove keys not present in the allowed list
const sanitizeData = (data: any, allowedKeys: string[]) => {
    const clean: any = {};
    allowedKeys.forEach(key => {
        if (data[key] !== undefined) {
            clean[key] = data[key];
        }
    });
    return clean;
};

// allowed keys for each table to prevent "column not found" errors
const ALLOWED_KEYS = {
    drop: ['title', 'description', 'status', 'egg_price', 'bundle_price', 'max_supply', 'artist_id', 'banner_path', 'start_at', 'end_at'],
    stamp: ['id', 'external_id', 'name', 'slug', 'rarity', 'status', 'collection', 'artist_id', 'art_path', 'price_eggs', 'edition_count', 'is_drop_only', 'design_config'],
    broadcast: ['name', 'subject', 'channels', 'audience_segment', 'audience_size', 'scheduled_at', 'status', 'stats'],
    promo: ['name', 'code', 'type', 'status', 'description', 'value', 'start_at', 'end_at', 'usage_count'],
    member: ['email', 'full_name', 'role', 'tier', 'egg_balance', 'status', 'id', 'created_at', 'last_seen']
};

export const PidgeyCreations = () => {
    const { creations, removeCreation, openPidgey } = useJarvis();
    const navigate = useNavigate();
    
    // Approval Modal State
    const [selectedDraft, setSelectedDraft] = useState<CreationDraft | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isFilling, setIsFilling] = useState(false);

    // --- Actions ---

    const handleReject = (id: string) => {
        if (!confirm("Are you sure you want to discard this draft? It cannot be recovered.")) return;
        removeCreation(id);
    };

    const openApprovalModal = (draft: CreationDraft) => {
        // Initialize form data based on draft type
        const initialData = { ...draft.data };
        
        // Defaults for specific types if missing
        if (draft.type === 'stamp') {
            initialData.price_eggs = initialData.price_eggs || 50;
            initialData.edition_count = initialData.edition_count || 5000;
            initialData.rarity = initialData.rarity || StampRarity.COMMON;
            initialData.collection = initialData.collection || 'General';
            initialData.status = StampStatus.DRAFT; // Default to draft for Inventory
        } else if (draft.type === 'drop') {
            initialData.status = DropStatus.DRAFT;
            initialData.egg_price = initialData.egg_price || 1;
        }

        setFormData(initialData);
        setSelectedDraft(draft);
    };

    const handlePidgeyFill = async () => {
        if (!selectedDraft) return;
        setIsFilling(true);
        // Map draft type to form type keys
        const formType = selectedDraft.type === 'stamp' ? 'stamp_designation' : selectedDraft.type;
        
        const data = await generateFormContent(formType, { currentData: formData });
        if (data) {
            setFormData(prev => ({
                ...prev,
                ...data
            }));
        }
        setIsFilling(false);
    };

    const handleFinalizeSave = async () => {
        if (!selectedDraft) return;
        setIsSaving(true);

        let result = { error: null as any };

        try {
            switch(selectedDraft.type) {
                case 'broadcast': {
                    const payload = sanitizeData(formData, ALLOWED_KEYS.broadcast);
                    result = await AdminService.broadcasts.create(payload);
                    break;
                }
                case 'drop': {
                    const payload = sanitizeData(formData, ALLOWED_KEYS.drop);
                    result = await AdminService.drops.create(payload);
                    break;
                }
                case 'promo': {
                    const payload = sanitizeData(formData, ALLOWED_KEYS.promo);
                    result = await AdminService.promos.create(payload);
                    break;
                }
                case 'stamp': {
                    // Ensure valid ID and fields
                    const rawPayload = {
                        ...formData,
                        external_id: formData.id && String(formData.id).startsWith('stp_') ? formData.id : `stp_${Date.now()}`,
                        status: 'draft', // Force draft to ensure it goes to Inventory/Designation
                    };
                    
                    // If we mapped to external_id, remove id so DB generates it
                    if (rawPayload.id && String(rawPayload.id).startsWith('stp_')) {
                        delete rawPayload.id;
                    }

                    const payload = sanitizeData(rawPayload, ALLOWED_KEYS.stamp);
                    result = await AdminService.stamps.create(payload);
                    break;
                }
                case 'member': {
                    const payload = sanitizeData(formData, ALLOWED_KEYS.member);
                    result = await AdminService.profiles.create(payload);
                    break;
                }
                default:
                    console.warn("Unknown draft type");
            }

            if (result.error) {
                console.error("Creation Error:", result.error);
                
                // Safe error message extraction
                const errMsg = result.error.message || JSON.stringify(result.error);

                // Robust check for missing table error
                if (errMsg.includes('Could not find the table') || errMsg.includes('relation') && errMsg.includes('does not exist')) {
                    alert(`🚨 DATABASE ERROR: Table not found.\n\nThe '${selectedDraft.type}s' table does not exist in your Supabase database yet.\n\nPlease go to Settings > Database, copy the Schema SQL, and run it in your Supabase SQL Editor.`);
                } else {
                    alert(`Error creating item: ${errMsg}`);
                }
            } else {
                // Success!
                removeCreation(selectedDraft.id);
                setSelectedDraft(null);
                
                if (selectedDraft.type === 'stamp') {
                    if(confirm(`✅ Stamp "${formData.name}" Approved!\n\nIt has been sent to the Stamp Inventory (Draft).\n\nWould you like to go to the Designation Studio to set its Supply & Price now?`)) {
                        navigate('/drops');
                    }
                } else if (selectedDraft.type === 'drop') {
                    if(confirm(`✅ Drop Campaign "${formData.title}" Created!\n\nWould you like to go to the Drops page to configure it?`)) {
                        navigate('/drops');
                    }
                } else {
                    alert(`✅ ${selectedDraft.type} Approved & Saved!`);
                }
            }
        } catch (e: any) {
            alert(`System error: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'drop': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'broadcast': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'promo': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'stamp': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        }
    };

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

    return (
        <div className="space-y-8 relative">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className="p-3 bg-gradient-to-tr from-pidgey-accent to-pidgey-secondary rounded-2xl text-pidgey-dark shadow-xl shadow-purple-500/30">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-pidgey-text">Pidgey Creations</h1>
                        <p className="text-sm text-pidgey-muted mt-1">Review, approve, or reject AI-generated drafts.</p>
                    </div>
                </div>
                <button 
                    onClick={() => openPidgey("I need you to draft a new campaign.")}
                    className="flex items-center gap-2 px-6 py-3 bg-pidgey-panel border border-pidgey-border text-pidgey-text hover:bg-pidgey-dark font-bold rounded-2xl transition backdrop-blur-md shadow-lg"
                >
                    <Bird size={20} className="text-pidgey-accent" /> Ask Pidgey for Drafts
                </button>
            </div>

            {creations.length === 0 ? (
                <div className="bg-pidgey-panel border border-pidgey-border border-dashed rounded-3xl p-16 text-center flex flex-col items-center backdrop-blur-sm">
                    <Bird size={80} className="text-pidgey-muted opacity-20 mb-6" />
                    <h3 className="text-xl font-bold text-pidgey-text mb-2">No Drafts Pending</h3>
                    <p className="text-pidgey-muted max-w-md mx-auto mb-8 text-sm leading-relaxed">
                        Pidgey hasn't created anything yet. Open the chat and ask him to "Draft a broadcast for Halloween" or "Create a new drop".
                    </p>
                    <button 
                        onClick={() => openPidgey()}
                        className="px-8 py-3 bg-pidgey-accent text-pidgey-dark font-bold rounded-2xl hover:bg-teal-300 transition shadow-lg shadow-teal-500/20"
                    >
                        Wake Up Pidgey
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {creations.map((draft) => (
                        <div key={draft.id} className="bg-pidgey-panel border border-pidgey-border rounded-3xl overflow-hidden hover:border-pidgey-accent/50 hover:shadow-2xl transition-all duration-300 shadow-lg group hover:-translate-y-1 flex flex-col">
                            {/* Card Header */}
                            <div className="p-5 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark/30">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${getTypeColor(draft.type)}`}>
                                    {draft.type}
                                </div>
                                <div className="text-xs text-pidgey-muted flex items-center gap-1 font-mono">
                                    <Clock size={12} /> {new Date(draft.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-pidgey-text mb-4 line-clamp-1">{draft.summary}</h3>
                                
                                {/* Image Preview for Stamps */}
                                {draft.type === 'stamp' && draft.data.art_path && (
                                    <div className="mb-5 bg-pidgey-dark rounded-2xl h-64 w-full flex items-center justify-center border border-pidgey-border relative overflow-hidden shadow-inner">
                                        <div className="absolute inset-0 bg-[radial-gradient(var(--pidgey-border)_1px,transparent_1px)] [background-size:10px_10px] opacity-20"></div>
                                        <img 
                                            src={draft.data.art_path} 
                                            alt={draft.data.name} 
                                            className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-105" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Image+Load+Error';
                                            }}
                                        />
                                        {draft.data.art_path.includes('picsum') && (
                                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-lg text-[9px] text-white backdrop-blur">Placeholder</div>
                                        )}
                                    </div>
                                )}

                                {/* Image Preview for Drops (Banner) */}
                                {draft.type === 'drop' && draft.data.banner_path && (
                                     <div className="mb-5 bg-pidgey-dark rounded-2xl overflow-hidden border border-pidgey-border h-28 relative shadow-inner">
                                         <img src={draft.data.banner_path} className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
                                     </div>
                                )}

                                <div className="bg-pidgey-dark/50 rounded-xl p-4 text-xs font-mono text-pidgey-muted overflow-hidden border border-pidgey-border mb-6 max-h-40 overflow-y-auto flex-1 custom-scrollbar">
                                    <pre>{JSON.stringify(draft.data, null, 2)}</pre>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button 
                                        onClick={() => handleReject(draft.id)}
                                        className="flex-1 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <button 
                                        onClick={() => openApprovalModal(draft)}
                                        className="flex-[2] py-3 bg-gradient-to-r from-pidgey-accent to-teal-400 text-pidgey-dark font-bold rounded-xl hover:brightness-110 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wide shadow-lg shadow-teal-500/20"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- APPROVAL MODAL --- */}
            {selectedDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                        {/* Header */}
                        <div className="p-6 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark/30">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-3 text-pidgey-text">
                                    <div className="p-1.5 bg-pidgey-accent/20 rounded-lg text-pidgey-accent"><Sparkles size={18} /></div>
                                    Finalize {selectedDraft.type}
                                    <button 
                                        onClick={handlePidgeyFill}
                                        disabled={isFilling}
                                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-pidgey-accent bg-pidgey-accent/10 hover:bg-pidgey-accent/20 px-3 py-1.5 rounded-full transition ml-2 border border-pidgey-accent/30"
                                    >
                                        <Sparkles size={10} className={isFilling ? "animate-spin" : ""} />
                                        Auto-Fill
                                    </button>
                                </h2>
                                <p className="text-xs text-pidgey-muted mt-1 ml-10">Review attributes before saving.</p>
                            </div>
                            <button onClick={() => setSelectedDraft(null)} className="p-2 hover:bg-pidgey-dark rounded-full text-pidgey-muted hover:text-pidgey-text transition"><XCircle size={24}/></button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-pidgey-panel">
                            
                            {/* STAMP EDITOR */}
                            {selectedDraft.type === 'stamp' && (
                                <div className="flex gap-8">
                                    {/* Left: Preview */}
                                    <div className="w-1/3">
                                         <div className="aspect-[3/4] bg-pidgey-dark border border-pidgey-border rounded-2xl overflow-hidden relative shadow-2xl ring-4 ring-black/10">
                                             <img src={formData.art_path} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src='https://via.placeholder.com/300x400'}/>
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

                            {/* GENERIC EDITOR (Drops/Broadcasts) */}
                            {selectedDraft.type !== 'stamp' && (
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
                                         <p>Additional configuration for <strong>{selectedDraft.type}</strong> is available in the edit screen after saving.</p>
                                     </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-pidgey-border bg-pidgey-dark/30 flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-xs text-pidgey-muted bg-pidgey-dark/50 p-2 rounded-lg border border-pidgey-border">
                                <MapPin size={14} className="text-pidgey-accent" />
                                <span className="font-bold uppercase tracking-wide text-[10px]">Destination:</span>
                                <span className="text-pidgey-text font-mono">{getDestinationHint(selectedDraft.type)}</span>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setSelectedDraft(null)} className="px-6 py-3 rounded-xl text-sm font-bold text-pidgey-muted hover:text-white hover:bg-white/5 transition">Cancel</button>
                                <button 
                                    onClick={handleFinalizeSave}
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
            )}
        </div>
    );
};
