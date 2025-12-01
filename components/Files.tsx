
import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Image as ImageIcon, Grid, List, Search, Upload, Loader, Plus, X, Save, Tag, RefreshCw, Database, Terminal, Sparkles, Activity } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { generateTagsForAsset, generateFormContent } from '../services/geminiService';
import { migrateAssets, runConnectionTest } from '../services/assetMigration';
import { Asset, AssetType, Stamp, StampRarity, StampStatus } from '../types';
import { useSafeMode } from '../SafeModeContext';
import { FileCard } from './files/FileCard';
import { useNavigate } from 'react-router-dom';

const BUCKETS = [
    { id: 'stamps', label: 'Stamps' },
    { id: 'templates', label: 'Templates' },
    { id: 'assets', label: 'Assets' },
    { id: 'public_stamps', label: 'Public Stamps' },
];

export const Files = () => {
    const [files, setFiles] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedBucket, setSelectedBucket] = useState('stamps');
    const [taggingId, setTaggingId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Migration State
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Stamp Creation State
    const [isStampModalOpen, setIsStampModalOpen] = useState(false);
    const [isUploadingArt, setIsUploadingArt] = useState(false);
    const [isFilling, setIsFilling] = useState(false);
    const [newStamp, setNewStamp] = useState<Partial<Stamp>>({
        rarity: StampRarity.COMMON,
        status: StampStatus.ACTIVE,
        price_eggs: 0,
        is_drop_only: false
    });
    
    const { isSafeMode } = useSafeMode();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, [selectedBucket]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [migrationLogs]);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await AdminService.files.list(selectedBucket);
        if (error) {
            console.error("Fetch error:", error);
        }
        setFiles(data);
        setLoading(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        await fetchData();
        setIsSyncing(false);
    };

    const handleTestConnection = async () => {
        setIsMigrating(true);
        setMigrationLogs(['Initializing connectivity test...']);
        await runConnectionTest((msg) => setMigrationLogs(prev => [...prev, msg]));
        // Note: We don't auto-close the log window so user can see result
    };

    const handleRunMigration = async () => {
        if (!confirm("Start Asset Migration?\n\nThis will download mock assets and upload them to your live Supabase Storage buckets.\nExisting files with same names will be overwritten.")) return;
        
        setIsMigrating(true);
        setMigrationLogs(['Initializing migration agent...']);
        
        await migrateAssets((msg) => {
            setMigrationLogs(prev => [...prev, msg]);
        });
        
        await fetchData();
    };

    const handleAutoTag = async (file: Asset) => {
        setTaggingId(file.id);
        const newTags = await generateTagsForAsset(file.name, file.type);
        setFiles(prev => prev.map(f => {
            if (f.id === file.id) {
                const tags = Array.from(new Set([...f.tags, ...newTags]));
                return { ...f, tags };
            }
            return f;
        }));
        setTaggingId(null);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("File size exceeds 10MB limit.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        
        const { data, error } = await AdminService.files.upload(file, selectedBucket);
        
        if (error) {
            alert(`Upload failed: ${error.message}`);
        } else if (data) {
            setFiles(prev => [data, ...prev]);
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleStampFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("File size exceeds 10MB limit.");
            if (stampFileInputRef.current) stampFileInputRef.current.value = '';
            return;
        }

        setIsUploadingArt(true);
        const { data, error } = await AdminService.files.upload(file, 'stamps');
        
        if (error) {
            alert(`Upload failed: ${error.message}`);
        } else if (data) {
            setNewStamp(prev => ({ ...prev, art_path: data.url }));
        }
        setIsUploadingArt(false);
        if (stampFileInputRef.current) stampFileInputRef.current.value = '';
    };

    const handleDelete = async (file: Asset) => {
        if (isSafeMode) {
             if (!confirm(`SAFE MODE: Are you sure you want to delete ${file.name}?`)) return;
        } else {
             if (!confirm(`Delete ${file.name} permanently?`)) return;
        }

        const { error } = await AdminService.files.delete(selectedBucket, file.name);
        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            setFiles(prev => prev.filter(f => f.id !== file.id));
        }
    };

    const handleEditInPlayground = (file: Asset) => {
        navigate('/playground', { state: { loadFile: file } });
    };

    // --- Stamp Creation Handlers ---
    
    const openStampCreator = (file?: Asset) => {
        setNewStamp({
            name: file ? file.name.split('.')[0] : '',
            rarity: StampRarity.COMMON,
            status: StampStatus.ACTIVE,
            price_eggs: 50,
            is_drop_only: false,
            collection: 'General',
            art_path: file ? file.url : ''
        });
        setIsStampModalOpen(true);
    };

    const handleCreateStamp = async () => {
        if (!newStamp.name || !newStamp.art_path) return alert("Name and Art URL required");
        
        const stampPayload = {
            ...newStamp,
            external_id: `stp_${Date.now()}`,
            created_at: new Date().toISOString()
        } as Stamp;
        
        console.log("Creating stamp with safe ID logic:", stampPayload);
        
        const { error } = await AdminService.stamps.create(stampPayload);
        
        if (error) {
             alert(`Failed to create stamp: ${error.message}`);
        } else {
             setIsStampModalOpen(false);
             alert(`Stamp "${newStamp.name}" created! (Check Drops & Stamps page)`);
        }
    };

    const handlePidgeyFill = async () => {
        setIsFilling(true);
        const data = await generateFormContent('stamp_creation');
        if (data) {
            setNewStamp(prev => ({
                ...prev,
                ...data,
                rarity: Object.values(StampRarity).includes(data.rarity) ? data.rarity : StampRarity.COMMON
            }));
        }
        setIsFilling(false);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-700/50 rounded-lg text-slate-300">
                        <FolderOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Asset Library</h1>
                        <p className="text-xs text-pidgey-muted">Manage storage buckets: {selectedBucket}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button 
                         onClick={handleTestConnection}
                         disabled={isMigrating}
                         className="flex items-center gap-2 px-3 py-2 bg-pidgey-dark border border-pidgey-border hover:bg-pidgey-panel text-pidgey-muted hover:text-white font-bold rounded-lg transition text-xs disabled:opacity-50"
                         title="Verify connectivity"
                     >
                         <Activity size={14} /> Test
                     </button>

                     <button 
                         onClick={handleRunMigration}
                         disabled={isMigrating}
                         className="flex items-center gap-2 px-4 py-2 bg-pidgey-secondary/10 border border-pidgey-secondary/30 text-pidgey-secondary hover:bg-pidgey-secondary hover:text-white font-bold rounded-lg transition text-sm disabled:opacity-50"
                         title="Import Mock Data to Real Storage"
                     >
                         <Database size={16} /> Run Asset Migration
                     </button>

                     <button 
                        onClick={handleSync}
                        disabled={isSyncing || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-pidgey-dark border border-pidgey-border hover:bg-pidgey-panel text-white font-bold rounded-lg transition text-sm disabled:opacity-50"
                        title="Refresh file list from server"
                     >
                        <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? 'Syncing...' : 'Sync'}
                     </button>

                     {selectedBucket === 'stamps' && (
                        <button 
                            onClick={() => openStampCreator()}
                            className="flex items-center gap-2 px-4 py-2 bg-pidgey-secondary text-white font-bold rounded-lg hover:bg-purple-600 transition text-sm"
                        >
                            <Plus size={16} /> New Stamp
                        </button>
                     )}
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                     />
                     <button 
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition text-sm disabled:opacity-50"
                     >
                        {isUploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />} 
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </div>

            {/* Bucket Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-pidgey-border">
                {BUCKETS.map(b => (
                    <button 
                        key={b.id}
                        onClick={() => setSelectedBucket(b.id)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors border-b-2 ${
                            selectedBucket === b.id 
                            ? 'border-pidgey-accent text-pidgey-accent bg-pidgey-panel' 
                            : 'border-transparent text-pidgey-muted hover:text-white hover:bg-pidgey-panel/50'
                        }`}
                    >
                        {b.label}
                    </button>
                ))}
            </div>

            {/* Migration Logs Overlay */}
            {isMigrating && (
                <div className="bg-black border border-pidgey-border rounded-xl p-4 font-mono text-xs shadow-2xl mb-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                         <div className="flex items-center gap-2 text-green-500 font-bold uppercase">
                             <Terminal size={14} /> Migration Console
                         </div>
                         <button onClick={() => setIsMigrating(false)} className="text-gray-500 hover:text-white"><X size={14}/></button>
                    </div>
                    <div className="h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                        {migrationLogs.map((log, idx) => (
                            <div key={idx} className={`${log.includes('❌') || log.includes('FAIL') ? 'text-red-400' : log.includes('✅') || log.includes('OK') ? 'text-green-400' : 'text-gray-300'}`}>
                                <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-pidgey-panel border border-pidgey-border rounded-xl">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={16} />
                    <input 
                        type="text" 
                        placeholder={`Search ${selectedBucket}...`}
                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-pidgey-accent text-white"
                    />
                </div>
                <div className="flex bg-pidgey-dark rounded-lg p-1 border border-pidgey-border">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}><Grid size={16}/></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}><List size={16}/></button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12 text-pidgey-muted">
                    <Loader className="animate-spin mb-2 mr-2" /> Loading {selectedBucket}...
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {/* Explicit Add Button for Stamps */}
                    {selectedBucket === 'stamps' && (
                        <button 
                            onClick={() => openStampCreator()} 
                            className="group aspect-[3/4] bg-pidgey-dark/30 border-4 border-dotted border-pidgey-border hover:border-pidgey-accent rounded-xl flex flex-col items-center justify-center text-pidgey-muted hover:text-pidgey-accent transition-colors cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-pidgey-panel group-hover:bg-pidgey-accent/20 flex items-center justify-center mb-3 transition-colors">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase">New Stamp</span>
                        </button>
                    )}

                    {files.map(file => (
                        <FileCard 
                            key={file.id} 
                            file={file} 
                            onAutoTag={handleAutoTag} 
                            isTagging={taggingId === file.id}
                            onDelete={handleDelete}
                            isSafeMode={isSafeMode}
                            onSelect={selectedBucket === 'stamps' ? () => openStampCreator(file) : undefined}
                            onDesign={selectedBucket === 'stamps' ? () => handleEditInPlayground(file) : undefined}
                            isStamp={selectedBucket === 'stamps' || file.type === AssetType.STAMP_ART}
                        />
                    ))}
                    {files.length === 0 && selectedBucket !== 'stamps' && (
                        <div className="col-span-full py-12 text-center text-pidgey-muted border-2 border-dashed border-pidgey-border rounded-xl">
                            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No files found in <strong>{selectedBucket}</strong>.</p>
                            <div className="flex justify-center gap-4 mt-4">
                                <button onClick={handleUploadClick} className="text-pidgey-accent hover:underline text-sm">Upload one now</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Stamp Modal */}
            {isStampModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-xl w-full max-w-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Tag size={20} className="text-pidgey-secondary" /> Create New Stamp
                                <button 
                                    onClick={handlePidgeyFill}
                                    disabled={isFilling}
                                    className="text-xs flex items-center gap-1 text-pidgey-accent bg-pidgey-accent/10 hover:bg-pidgey-accent/20 px-2 py-1 rounded transition ml-2 border border-pidgey-accent/30"
                                >
                                    <Sparkles size={12} className={isFilling ? "animate-spin" : ""} />
                                    Auto-Fill
                                </button>
                            </h2>
                            <button onClick={() => setIsStampModalOpen(false)} className="text-pidgey-muted hover:text-white"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            {/* Art Preview & Upload */}
                            <div className="flex justify-center mb-4">
                                <input 
                                    type="file" 
                                    ref={stampFileInputRef} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={handleStampFileChange}
                                />
                                <div 
                                    onClick={() => stampFileInputRef.current?.click()}
                                    className="w-32 h-44 bg-pidgey-dark rounded-lg border-4 border-dotted border-pidgey-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-pidgey-accent group relative"
                                >
                                    {newStamp.art_path ? (
                                        <>
                                            <img src={newStamp.art_path} className="w-full h-full object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Upload size={20} className="text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-pidgey-muted group-hover:text-pidgey-accent">
                                            {isUploadingArt ? <Loader className="animate-spin" /> : <Upload size={24} />}
                                            <span className="text-[10px] font-bold uppercase">{isUploadingArt ? 'Uploading...' : 'Upload Art'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Stamp Name</label>
                                <input 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                    value={newStamp.name || ''}
                                    onChange={e => setNewStamp({...newStamp, name: e.target.value})}
                                    placeholder="e.g. Golden Pidgey"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Rarity</label>
                                    <select 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                        value={newStamp.rarity}
                                        onChange={e => setNewStamp({...newStamp, rarity: e.target.value as StampRarity})}
                                    >
                                        {Object.values(StampRarity).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Status</label>
                                    <select 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                        value={newStamp.status}
                                        onChange={e => setNewStamp({...newStamp, status: e.target.value as StampStatus})}
                                    >
                                        {Object.values(StampStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Collection</label>
                                    <input 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                        value={newStamp.collection || ''}
                                        onChange={e => setNewStamp({...newStamp, collection: e.target.value})}
                                        placeholder="e.g. Origins"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Price (Eggs)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white focus:border-pidgey-accent outline-none"
                                        value={newStamp.price_eggs || 0}
                                        onChange={e => setNewStamp({...newStamp, price_eggs: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 p-2 border border-pidgey-border rounded bg-pidgey-dark/50">
                                <input 
                                    type="checkbox" 
                                    id="isDropOnly"
                                    checked={newStamp.is_drop_only}
                                    onChange={e => setNewStamp({...newStamp, is_drop_only: e.target.checked})}
                                    className="rounded border-pidgey-border bg-pidgey-dark text-pidgey-accent focus:ring-pidgey-accent"
                                />
                                <label htmlFor="isDropOnly" className="text-sm text-pidgey-text cursor-pointer select-none">Drop Only (Not available in general store)</label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Art URL</label>
                                <input 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white text-xs font-mono truncate"
                                    value={newStamp.art_path || ''}
                                    readOnly
                                    title={newStamp.art_path}
                                />
                            </div>

                            <button 
                                onClick={handleCreateStamp}
                                className="w-full py-3 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 mt-2 flex justify-center items-center gap-2"
                            >
                                <Save size={18} /> Create Stamp Entity
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
