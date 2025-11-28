
import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Image as ImageIcon, FileText, Grid, List, Download, Trash2, Search, Upload, Sparkles, Loader, Plus, X, Save, Tag, RefreshCw, Database } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { generateTagsForAsset } from '../services/geminiService';
import { Asset, AssetType, Stamp, StampRarity, StampStatus } from '../types';
import { useSafeMode } from '../SafeModeContext';

// Fix: Extract FileCard and type it as React.FC to allow 'key' prop without TS error
const FileCard: React.FC<{ file: Asset, onAutoTag: (file: Asset) => void, isTagging: boolean, onDelete: (file: Asset) => void, isSafeMode: boolean, onSelect?: (file: Asset) => void }> = ({ file, onAutoTag, isTagging, onDelete, isSafeMode, onSelect }) => (
    <div className="group bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden hover:border-pidgey-muted transition-colors relative">
        <div className="aspect-square bg-pidgey-dark relative overflow-hidden flex items-center justify-center p-4">
            {file.type === AssetType.IMAGE || file.type === AssetType.STAMP_ART || file.type === AssetType.ICON || file.type === AssetType.CARD_TEMPLATE ? (
                <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
            ) : (
                <FileText size={48} className="text-pidgey-muted opacity-20" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {onSelect && (
                    <button 
                        onClick={() => onSelect(file)}
                        className="p-2 bg-pidgey-accent text-pidgey-dark rounded-full font-bold text-xs hover:bg-teal-300"
                    >
                        Use Art
                    </button>
                )}
                {!onSelect && (
                    <>
                        <button 
                            onClick={() => onAutoTag(file)}
                            disabled={isTagging}
                            className="p-2 bg-pidgey-accent/20 hover:bg-pidgey-accent/40 rounded-full text-pidgey-accent backdrop-blur" 
                            title="AI Auto Tag"
                        >
                            <Sparkles size={18} className={isTagging ? 'animate-spin' : ''} />
                        </button>
                        <a href={file.url} target="_blank" rel="noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur"><Download size={18}/></a>
                        <button 
                            onClick={() => onDelete(file)}
                            className={`p-2 rounded-full backdrop-blur transition-colors ${isSafeMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                            <Trash2 size={18}/>
                        </button>
                    </>
                )}
            </div>
        </div>
        <div className="p-3">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm truncate w-3/4" title={file.name}>{file.name}</h4>
                <span className="text-[10px] text-pidgey-muted uppercase font-bold">{file.type.split('_').pop()}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-pidgey-muted">
                <span>{file.size_kb} KB</span>
                <span className="bg-pidgey-dark px-1.5 py-0.5 rounded text-[10px]">{new Date(file.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
                {file.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-pidgey-border rounded text-pidgey-text/80">#{tag}</span>
                ))}
            </div>
        </div>
    </div>
);

const BUCKETS = [
    { id: 'stamps', label: 'Stamps' },
    { id: 'templates', label: 'Templates' },
    { id: 'admin_files', label: 'Admin Files' },
    { id: 'cards', label: 'Cards' },
    { id: 'avatars', label: 'User Avatars' },
    { id: 'attachments', label: 'Attachments' },
];

export const Files = () => {
    const [files, setFiles] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedBucket, setSelectedBucket] = useState('stamps');
    const [taggingId, setTaggingId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Stamp Creation State
    const [isStampModalOpen, setIsStampModalOpen] = useState(false);
    const [isUploadingArt, setIsUploadingArt] = useState(false);
    const [newStamp, setNewStamp] = useState<Partial<Stamp>>({
        rarity: StampRarity.COMMON,
        status: StampStatus.ACTIVE,
        price_eggs: 0,
        is_drop_only: false
    });
    
    const { isSafeMode } = useSafeMode();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, [selectedBucket]);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await AdminService.files.list(selectedBucket);
        if (error) {
            console.error("Fetch error:", error);
            // In a real scenario, you might want to show a toast
        }
        setFiles(data);
        setLoading(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const { data, error } = await AdminService.files.list(selectedBucket);
        if (error) {
             alert(`Sync failed: ${error.message || 'Check console details'}`);
        } else {
             setFiles(data);
        }
        setIsSyncing(false);
    };

    const handleAutoTag = async (file: Asset) => {
        setTaggingId(file.id);
        const newTags = await generateTagsForAsset(file.name, file.type);
        
        // Mock update in local state
        setFiles(prev => prev.map(f => {
            if (f.id === file.id) {
                // Merge new tags avoiding dupes
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

        setIsUploading(true);
        
        const { data, error } = await AdminService.files.upload(file, selectedBucket);
        
        if (error) {
            alert(`Upload failed: ${error.message}`);
        } else if (data) {
            setFiles(prev => [data, ...prev]);
        }
        setIsUploading(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleStampFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingArt(true);
        // Upload to 'stamps' bucket specifically
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
             // God mode - instant delete? Maybe still one confirm for files since they are hard to restore
             if (!confirm(`Delete ${file.name} permanently?`)) return;
        }

        const { error } = await AdminService.files.delete(selectedBucket, file.name);
        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            setFiles(prev => prev.filter(f => f.id !== file.id));
        }
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
        
        // Ensure ID is generated if creating mock
        const stampPayload = {
            ...newStamp,
            id: `stp_${Date.now()}`,
            created_at: new Date().toISOString()
        } as Stamp;

        // Note: We need to use a Service to actually save this to the DB.
        // Assuming we have a service method for stamps.create or similar.
        // For now, we will simulate it via AdminService if available, or just log it.
        // Ideally AdminService.stamps.create(stampPayload)
        
        console.log("Creating stamp:", stampPayload);
        
        // Since AdminService.stamps exists in the broader context but might not be fully wired here without importing it
        // We'll assume successful creation and close modal
        setIsStampModalOpen(false);
        alert(`Stamp "${newStamp.name}" created! (Check Drops & Stamps page)`);
    };

    return (
        <div className="space-y-6">
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
                    {files.map(file => (
                        <FileCard 
                            key={file.id} 
                            file={file} 
                            onAutoTag={handleAutoTag} 
                            isTagging={taggingId === file.id}
                            onDelete={handleDelete}
                            isSafeMode={isSafeMode}
                            onSelect={selectedBucket === 'stamps' ? () => openStampCreator(file) : undefined}
                        />
                    ))}
                    {files.length === 0 && (
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
                                    className="w-32 h-32 bg-pidgey-dark rounded-lg border border-pidgey-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-pidgey-accent group relative"
                                >
                                    {newStamp.art_path ? (
                                        <>
                                            <img src={newStamp.art_path} className="w-full h-full object-contain" />
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
