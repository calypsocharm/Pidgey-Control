
import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Image as ImageIcon, FileText, Grid, List, Download, Trash2, Search, Upload, Sparkles, Loader } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { generateTagsForAsset } from '../services/geminiService';
import { Asset, AssetType } from '../types';
import { useSafeMode } from '../SafeModeContext';

// Fix: Extract FileCard and type it as React.FC to allow 'key' prop without TS error
const FileCard: React.FC<{ file: Asset, onAutoTag: (file: Asset) => void, isTagging: boolean, onDelete: (file: Asset) => void, isSafeMode: boolean }> = ({ file, onAutoTag, isTagging, onDelete, isSafeMode }) => (
    <div className="group bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden hover:border-pidgey-muted transition-colors">
        <div className="aspect-square bg-pidgey-dark relative overflow-hidden flex items-center justify-center p-4">
            {file.type === AssetType.IMAGE || file.type === AssetType.STAMP_ART || file.type === AssetType.ICON || file.type === AssetType.CARD_TEMPLATE ? (
                <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
            ) : (
                <FileText size={48} className="text-pidgey-muted opacity-20" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
    
    const { isSafeMode } = useSafeMode();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, [selectedBucket]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await AdminService.files.list(selectedBucket);
        setFiles(data);
        setLoading(false);
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
                        />
                    ))}
                    {files.length === 0 && (
                        <div className="col-span-full py-12 text-center text-pidgey-muted border-2 border-dashed border-pidgey-border rounded-xl">
                            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No files found in <strong>{selectedBucket}</strong>.</p>
                            <button onClick={handleUploadClick} className="text-pidgey-accent hover:underline mt-2">Upload one now</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
