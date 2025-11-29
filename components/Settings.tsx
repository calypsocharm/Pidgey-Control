import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, CreditCard, Activity, Globe, Save, Plus, Trash2, Database, Copy, Server, CloudLightning, Check, AlertOctagon, UploadCloud, RefreshCw } from 'lucide-react';
import { PUBLIC_SCHEMA_DDL } from '../schema';
import { AdminService } from '../services/adminService';

export const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    // Health Diagnostic State
    const [healthData, setHealthData] = useState<any>(null);
    const [runningDiagnostics, setRunningDiagnostics] = useState(false);
    
    // Seeding State
    const [isSeeding, setIsSeeding] = useState(false);

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

    const handleCopySchema = () => {
        navigator.clipboard.writeText(PUBLIC_SCHEMA_DDL);
        alert("Schema SQL copied to clipboard! Paste this into your Supabase SQL Editor to fix missing tables.");
    };
    
    const handleSeedUsers = async () => {
        if (!confirm("This will insert mock users into your live database. Proceed?")) return;
        setIsSeeding(true);
        try {
            const results = await AdminService.profiles.seedMockUsers();
            const successCount = results.filter(r => r.success).length;
            alert(`Seeding Complete!\nSuccessfully inserted: ${successCount}\nFailed: ${results.length - successCount}`);
        } catch(e: any) {
            alert("Seeding failed: " + e.message);
        }
        setIsSeeding(false);
    };

    const runDiagnostics = async () => {
        setRunningDiagnostics(true);
        const sys = await AdminService.health.getSystem();
        const sb = await AdminService.health.getSupabase();
        const smtp = await AdminService.health.getSmtp();
        
        setHealthData({ sys, sb, smtp });
        setRunningDiagnostics(false);
    };

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
                <TabButton id="database" label="Database Schema" icon={Database} />
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
                
                {activeTab === 'database' && (
                    <div className="p-8 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Database size={20} className="text-pidgey-muted" /> Schema Management
                                </h2>
                                <p className="text-sm text-pidgey-muted mt-1 max-w-lg">
                                    If you are seeing "Table not found" errors, your Supabase project might be missing the required tables. Copy the SQL below and run it in your Supabase SQL Editor.
                                </p>
                            </div>
                            <button 
                                onClick={handleCopySchema}
                                className="flex items-center gap-2 px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition"
                            >
                                <Copy size={16} /> Copy SQL
                            </button>
                        </div>
                        
                        <div className="flex-1 bg-black/50 border border-pidgey-border rounded-lg p-4 overflow-auto font-mono text-xs text-blue-200 shadow-inner mb-6 max-h-[400px]">
                            <pre>{PUBLIC_SCHEMA_DDL}</pre>
                        </div>

                         <div className="pt-6 border-t border-pidgey-border">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                <Server size={18} /> Database Seeding
                            </h3>
                            <div className="bg-pidgey-dark p-4 rounded-lg border border-pidgey-border flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold">Populate Mock Users</p>
                                    <p className="text-xs text-pidgey-muted">Inserts the mock profiles (Alice, Hatter, Queen) into the 'profiles' table.</p>
                                </div>
                                <button 
                                    onClick={handleSeedUsers}
                                    disabled={isSeeding}
                                    className="px-4 py-2 bg-pidgey-secondary/20 text-pidgey-secondary border border-pidgey-secondary/50 font-bold rounded-lg hover:bg-pidgey-secondary hover:text-white transition flex items-center gap-2"
                                >
                                    {isSeeding ? <RefreshCw className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                                    {isSeeding ? 'Seeding...' : 'Seed Mock Users'}
                                </button>
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
                     <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                 <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Activity size={20} className="text-pidgey-accent" /> System Diagnostics
                                </h2>
                                <p className="text-sm text-pidgey-muted">Real-time connectivity and service status checks.</p>
                            </div>
                            <button 
                                onClick={runDiagnostics} 
                                disabled={runningDiagnostics}
                                className="px-4 py-2 bg-pidgey-dark border border-pidgey-border hover:bg-pidgey-panel rounded-lg text-sm font-bold flex items-center gap-2"
                            >
                                <Activity size={16} className={runningDiagnostics ? "animate-spin" : ""} />
                                {runningDiagnostics ? 'Running...' : 'Run Diagnostics'}
                            </button>
                        </div>

                        {!healthData ? (
                             <div className="flex flex-col items-center justify-center h-64 text-pidgey-muted border-2 border-dashed border-pidgey-border rounded-xl">
                                <Server size={48} className="mb-4 opacity-20" />
                                <p>Run diagnostics to check system health.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                {/* Supabase Card */}
                                <div className="bg-pidgey-dark border border-pidgey-border rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Database className="text-green-400" size={24} />
                                        <div>
                                            <h3 className="font-bold text-lg">Supabase Services</h3>
                                            <p className="text-xs text-pidgey-muted">Database & Storage Engine</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                             <div className="text-2xl font-mono font-bold text-white">{healthData.sb.latency_ms}ms</div>
                                             <div className="text-[10px] text-pidgey-muted uppercase">Latency</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-pidgey-panel p-3 rounded-lg flex justify-between items-center">
                                            <span className="text-sm font-medium">Postgres DB</span>
                                            {healthData.sb.dbStatus === 'connected' ? (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Check size={12}/> Connected</span>
                                            ) : (
                                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><AlertOctagon size={12}/> Error</span>
                                            )}
                                        </div>
                                        <div className="bg-pidgey-panel p-3 rounded-lg flex justify-between items-center">
                                             <span className="text-sm font-medium">Storage Buckets</span>
                                             {healthData.sb.storageStatus === 'active' ? (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Check size={12}/> Active</span>
                                            ) : (
                                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><AlertOctagon size={12}/> Error</span>
                                            )}
                                        </div>
                                    </div>
                                    {healthData.sb.error && (
                                        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded text-xs text-red-300 font-mono">
                                            Error: {healthData.sb.error}
                                        </div>
                                    )}
                                </div>

                                {/* SMTP Card */}
                                <div className="bg-pidgey-dark border border-pidgey-border rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <CloudLightning className="text-yellow-400" size={24} />
                                        <div>
                                            <h3 className="font-bold text-lg">Email Relay</h3>
                                            <p className="text-xs text-pidgey-muted">SMTP2GO Provider Status</p>
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-pidgey-panel p-3 rounded-lg flex justify-between items-center">
                                            <span className="text-sm font-medium">API Key Config</span>
                                            {healthData.smtp.keyPresent ? (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Check size={12}/> Present</span>
                                            ) : (
                                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><AlertOctagon size={12}/> Missing</span>
                                            )}
                                        </div>
                                        <div className="bg-pidgey-panel p-3 rounded-lg flex justify-between items-center">
                                             <span className="text-sm font-medium">Relay Status</span>
                                             <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold uppercase">{healthData.smtp.relayStatus}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Version Footer */}
                                 <div className="text-center pt-4">
                                    <span className="text-xs text-pidgey-muted font-mono">
                                        System Version: {healthData.sys.version} • Environment: {healthData.sys.environment}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Save Action */}
                {activeTab !== 'database' && activeTab !== 'health' && (
                    <div className="p-6 border-t border-pidgey-border bg-pidgey-dark/30 flex justify-end">
                        <button className="flex items-center gap-2 px-6 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition">
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};