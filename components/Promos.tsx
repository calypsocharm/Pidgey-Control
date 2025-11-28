
import React, { useState, useEffect } from 'react';
import { StickyNote, Tag, Copy, Plus, MoreHorizontal, Power, Clock, Save, X } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Promo, PromoStatus, PromoType } from '../types';
import { useJarvis } from '../JarvisContext';

export const Promos = () => {
    const [promos, setPromos] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Create/Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPromo, setCurrentPromo] = useState<Partial<Promo>>({});

    const { draftPayload, setDraftPayload } = useJarvis();

    useEffect(() => {
        fetchData();
    }, []);

    // Listen for AI drafts
    useEffect(() => {
        if (draftPayload && draftPayload.type === 'DRAFT_PROMO') {
            console.log("Received promo draft:", draftPayload.data);
            setCurrentPromo(draftPayload.data);
            setIsModalOpen(true);
            setDraftPayload(null);
        }
    }, [draftPayload, setDraftPayload]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await AdminService.promos.list();
        setPromos(data);
        setLoading(false);
    };

    const handleNewPromo = () => {
        setCurrentPromo({
            name: '',
            code: '',
            type: PromoType.DISCOUNT,
            status: PromoStatus.DRAFT,
            description: '',
            value: { percent: 10 },
            usage_count: 0
        });
        setIsModalOpen(true);
    };

    const handleEditPromo = (promo: Promo) => {
        setCurrentPromo({ ...promo });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentPromo.name || !currentPromo.code) return alert("Name and Code required.");
        
        // In real app, call create/update API
        console.log("Saving promo", currentPromo);
        
        // Mock update local list
        const newPromo = { 
            ...currentPromo, 
            id: currentPromo.id || `prm_${Date.now()}`,
            created_at: currentPromo.created_at || new Date().toISOString()
        } as Promo;

        if (currentPromo.id) {
            setPromos(prev => prev.map(p => p.id === newPromo.id ? newPromo : p));
        } else {
            setPromos(prev => [newPromo, ...prev]);
        }
        
        setIsModalOpen(false);
    };

    const getTypeLabel = (type: PromoType) => {
        switch(type) {
            case PromoType.DISCOUNT: return { label: 'Discount', color: 'bg-green-500/20 text-green-400' };
            case PromoType.EGG_BONUS: return { label: 'Egg Bonus', color: 'bg-yellow-500/20 text-yellow-400' };
            case PromoType.FREE_STAMP: return { label: 'Free Stamp', color: 'bg-purple-500/20 text-purple-400' };
            case PromoType.SEASONAL: return { label: 'Seasonal', color: 'bg-pink-500/20 text-pink-400' };
            default: return { label: type, color: 'bg-slate-700' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-pidgey-accent/10 rounded-lg text-pidgey-accent">
                        <StickyNote size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Promos & Campaigns</h1>
                </div>
                <button 
                    onClick={handleNewPromo}
                    className="flex items-center gap-2 px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition"
                >
                    <Plus size={18} /> New Promo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promos.map(promo => {
                    const typeStyle = getTypeLabel(promo.type);
                    return (
                        <div key={promo.id} onClick={() => handleEditPromo(promo)} className="bg-pidgey-panel border border-pidgey-border rounded-xl p-6 relative group hover:border-pidgey-accent transition-colors cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{promo.name}</h3>
                                    <p className="text-xs text-pidgey-muted">{promo.description}</p>
                                </div>
                                <div className={`p-2 rounded-lg ${promo.status === PromoStatus.ACTIVE ? 'bg-green-500/10 text-green-500' : 'bg-slate-700/50 text-slate-400'}`}>
                                    <Power size={18} />
                                </div>
                            </div>
                            
                            <div className="bg-pidgey-dark rounded-lg p-3 flex items-center justify-between mb-4 border border-dashed border-pidgey-border">
                                <code className="font-mono text-pidgey-accent font-bold tracking-wider">{promo.code}</code>
                                <button className="text-pidgey-muted hover:text-white" title="Copy Code">
                                    <Copy size={14} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${typeStyle.color}`}>
                                    {typeStyle.label}
                                </span>
                                {promo.value.percent && (
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-pidgey-border text-white">
                                        {promo.value.percent}% OFF
                                    </span>
                                )}
                                {promo.value.eggs && (
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-pidgey-border text-white">
                                        +{promo.value.eggs} EGGS
                                    </span>
                                )}
                            </div>

                            <div className="pt-4 border-t border-pidgey-border flex justify-between items-center text-xs text-pidgey-muted">
                                <div className="flex items-center gap-1">
                                    <Tag size={12} />
                                    <span>{promo.usage_count} uses</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>{promo.end_at ? `Ends ${new Date(promo.end_at).toLocaleDateString()}` : 'No expiry'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-xl w-full max-w-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-pidgey-border pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {currentPromo.id ? 'Edit Promo' : 'New Promo Campaign'}
                                {draftPayload && draftPayload.type === 'DRAFT_PROMO' && (
                                    <span className="text-xs bg-pidgey-accent/20 text-pidgey-accent px-2 py-0.5 rounded-full">AI Draft</span>
                                )}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-pidgey-muted hover:text-white"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Campaign Name</label>
                                    <input 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                        value={currentPromo.name}
                                        onChange={e => setCurrentPromo({...currentPromo, name: e.target.value})}
                                        placeholder="e.g. Summer Sale"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Promo Code</label>
                                    <input 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white font-mono uppercase focus:border-pidgey-accent outline-none"
                                        value={currentPromo.code}
                                        onChange={e => setCurrentPromo({...currentPromo, code: e.target.value.toUpperCase()})}
                                        placeholder="CODE123"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Type</label>
                                    <select 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                        value={currentPromo.type}
                                        onChange={e => setCurrentPromo({...currentPromo, type: e.target.value as PromoType})}
                                    >
                                        <option value={PromoType.DISCOUNT}>Discount (%)</option>
                                        <option value={PromoType.EGG_BONUS}>Egg Bonus</option>
                                        <option value={PromoType.FREE_STAMP}>Free Stamp</option>
                                        <option value={PromoType.SEASONAL}>Seasonal Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Status</label>
                                    <select 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                        value={currentPromo.status}
                                        onChange={e => setCurrentPromo({...currentPromo, status: e.target.value as PromoStatus})}
                                    >
                                        <option value={PromoStatus.DRAFT}>Draft</option>
                                        <option value={PromoStatus.ACTIVE}>Active</option>
                                        <option value={PromoStatus.PAUSED}>Paused</option>
                                        <option value={PromoStatus.EXPIRED}>Expired</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Description</label>
                                <textarea 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none h-20 text-sm"
                                    value={currentPromo.description || ''}
                                    onChange={e => setCurrentPromo({...currentPromo, description: e.target.value})}
                                    placeholder="Internal notes or customer-facing details..."
                                />
                            </div>

                            <div className="p-4 bg-pidgey-dark rounded-xl border border-pidgey-border">
                                <h3 className="text-xs font-bold text-white uppercase mb-4">Value Configuration</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {currentPromo.type === PromoType.DISCOUNT && (
                                        <div>
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Discount %</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-pidgey-panel border border-pidgey-border rounded-lg p-2 text-white"
                                                value={currentPromo.value?.percent || ''}
                                                onChange={e => setCurrentPromo({...currentPromo, value: { ...currentPromo.value, percent: parseInt(e.target.value) }})}
                                            />
                                        </div>
                                    )}
                                    {currentPromo.type === PromoType.EGG_BONUS && (
                                         <div>
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Eggs Quantity</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-pidgey-panel border border-pidgey-border rounded-lg p-2 text-white"
                                                value={currentPromo.value?.eggs || ''}
                                                onChange={e => setCurrentPromo({...currentPromo, value: { ...currentPromo.value, eggs: parseInt(e.target.value) }})}
                                            />
                                        </div>
                                    )}
                                    <div>
                                         <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Expiry Date</label>
                                         <input 
                                            type="date"
                                            className="w-full bg-pidgey-panel border border-pidgey-border rounded-lg p-2 text-white text-sm"
                                            value={currentPromo.end_at ? currentPromo.end_at.split('T')[0] : ''}
                                            onChange={e => setCurrentPromo({...currentPromo, end_at: new Date(e.target.value).toISOString()})}
                                         />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSave}
                                className="w-full py-3 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition flex justify-center items-center gap-2"
                            >
                                <Save size={18} /> Save Promo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
