
import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, CreditCard, Activity, Globe, Save } from 'lucide-react';

export const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

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
                         <div>
                            <h2 className="text-xl font-bold mb-4">Base Rates</h2>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium">Standard Egg Price (USD)</label>
                                        <span className="text-pidgey-accent font-mono">$0.99</span>
                                    </div>
                                    <input type="range" className="w-full h-2 bg-pidgey-dark rounded-lg appearance-none cursor-pointer" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium">Daily Login Bonus (Eggs)</label>
                                        <span className="text-pidgey-accent font-mono">1</span>
                                    </div>
                                    <input type="number" defaultValue="1" className="bg-pidgey-dark border border-pidgey-border rounded px-2 py-1 w-20 text-center" />
                                </div>
                            </div>
                        </div>
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
