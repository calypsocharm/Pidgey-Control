
import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, CreditCard, Activity, Globe, Save, Plus, Trash2 } from 'lucide-react';

export const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    // Economy State Mock
    const [bundles, setBundles] = useState([
        { id: 1, name: 'Single Egg', amount: 1, price: 2.99 },
        { id: 2, name: 'Handful', amount: 5, price: 9.99 },
        { id: 3, name: 'Nest', amount: 12, price: 19.99 },
    ]);
    const [hatchOdds, setHatchOdds] = useState({ common: 60, rare: 30, legendary: 9, pidgey: 1 });

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id 
                ? 'bg-pidgey-accent/10 text-pidgey-accent border border-pidgey-accent/20' 
                : 'text-pidgey-muted hover:text-white hover:bg-pidgey-panel'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                <div className="mb-6 px-2">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <SettingsIcon className="text-pidgey-muted" /> Settings
                    </h1>
                </div>
                <TabButton id="general" label="App & Brand" icon={Globe} />
                <TabButton id="economy" label="Game Economy" icon={CreditCard} />
                <TabButton id="roles" label="Roles & Access" icon={Shield} />
                <TabButton id="health" label="System Health" icon={Activity} />
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden min-h-[600px]">
                {activeTab === 'general' && (
                    <div className="p-8 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold mb-4">Brand Configuration</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">App Name</label>
                                    <input type="text" defaultValue="PidgeyPost" className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Support Email</label>
                                    <input type="email" defaultValue="help@pidgeypost.com" className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-pidgey-border">
                            <h2 className="text-xl font-bold mb-4">Card Defaults</h2>
                             <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Link Expiry (Days)</label>
                                    <input type="number" defaultValue="30" className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'economy' && (
                    <div className="p-8 space-y-8">
                         {/* 1. Global Rates */}
                         <div>
                            <h2 className="text-xl font-bold mb-4">Engagement Levers</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-pidgey-muted">Daily Login Bonus</label>
                                        <span className="text-pidgey-accent font-bold">1 Egg</span>
                                    </div>
                                    <input type="number" defaultValue="1" className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white" />
                                    <p className="text-[10px] text-pidgey-muted mt-1">Free eggs given just for opening the app.</p>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-pidgey-muted">Max Free Inventory</label>
                                        <span className="text-pidgey-accent font-bold">10 Eggs</span>
                                    </div>
                                    <input type="number" defaultValue="10" className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white" />
                                    <p className="text-[10px] text-pidgey-muted mt-1">Cap on free eggs to encourage spending.</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Purchase Bundles */}
                        <div className="pt-6 border-t border-pidgey-border">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">Purchase Bundles</h2>
                                    <p className="text-xs text-pidgey-muted">Define the packs available in the shop.</p>
                                </div>
                                <button className="p-2 bg-pidgey-dark hover:bg-white/10 rounded-lg text-pidgey-muted hover:text-white transition">
                                    <Plus size={16} />
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {bundles.map((bundle) => (
                                    <div key={bundle.id} className="flex items-center gap-4 bg-pidgey-dark p-3 rounded-lg border border-pidgey-border">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-pidgey-muted uppercase">Bundle Name</label>
                                            <input defaultValue={bundle.name} className="w-full bg-transparent border-b border-transparent focus:border-pidgey-accent outline-none text-sm font-medium" />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] font-bold text-pidgey-muted uppercase">Eggs</label>
                                            <input type="number" defaultValue={bundle.amount} className="w-full bg-transparent border-b border-transparent focus:border-pidgey-accent outline-none text-sm font-medium" />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] font-bold text-pidgey-muted uppercase">Price ($)</label>
                                            <input type="number" defaultValue={bundle.price} className="w-full bg-transparent border-b border-transparent focus:border-pidgey-accent outline-none text-sm font-medium text-green-400" />
                                        </div>
                                        <button className="text-pidgey-muted hover:text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Game Balance (Rarity) */}
                        <div className="pt-6 border-t border-pidgey-border">
                            <h2 className="text-xl font-bold mb-4">Hatch Probabilities (Rarity)</h2>
                            <div className="space-y-4">
                                {Object.entries(hatchOdds).map(([rarity, value]) => (
                                    <div key={rarity}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-bold uppercase text-pidgey-muted">{rarity}</span>
                                            <span className="text-xs font-mono">{value}%</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={value} 
                                                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-pidgey-dark accent-pidgey-accent`}
                                                onChange={() => {}} // In real app, update state
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="p-3 bg-yellow-900/10 border border-yellow-700/30 rounded text-xs text-yellow-500 text-center">
                                    Total Probability: {Object.values(hatchOdds).reduce((a: number, b: number) => a + b, 0)}% (Must equal 100%)
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'roles' && (
                     <div className="p-8 flex flex-col items-center justify-center text-pidgey-muted h-full">
                        <Shield size={48} className="mb-4 opacity-20" />
                        <p>Team Management coming in v1.3</p>
                    </div>
                )}

                {activeTab === 'health' && (
                     <div className="p-8 flex flex-col items-center justify-center text-pidgey-muted h-full">
                        <Activity size={48} className="mb-4 opacity-20" />
                        <p>System Health Logs coming in v1.3</p>
                    </div>
                )}

                {/* Footer Save Action */}
                <div className="p-6 border-t border-pidgey-border bg-pidgey-dark/30 flex justify-end">
                    <button className="flex items-center gap-2 px-6 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
