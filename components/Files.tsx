
import React, { useState, useEffect } from 'react';
import { FolderOpen, Image as ImageIcon, FileText, Grid, List, Filter, Download, Trash2, Search, Upload, Sparkles } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { generateTagsForAsset } from '../services/geminiService';
import { Asset, AssetType } from '../types';

// Fix: Extract FileCard and type it as React.FC to allow 'key' prop without TS error
const FileCard: React.FC<{ file: Asset, onAutoTag: (file: Asset) => void, isTagging: boolean }> = ({ file, onAutoTag, isTagging }) => (
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
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur"><Download size={18}/></button>
                <button className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-200 backdrop-blur"><Trash2 size={18}/></button>
            </div>
        </div>
        <div className="p-3">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm truncate w-3/4" title={file.name}>{file.name}</h4>
                <span className="text-[10px] text-pidgey-muted uppercase font-bold">{file.type.split('_').pop()}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-pidgey-muted">
                <span>{file.size_kb} KB</span>
                <span className="bg-pidgey-dark px-1.5 py-0.5 rounded text-[10px]">{file.usage_count} uses</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
                {file.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-pidgey-border rounded text-pidgey-text/80">#{tag}</span>
                ))}
            </div>
        </div>
    </div>
);

export const Files = () => {
    const [files, setFiles] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState('all');
    const [taggingId, setTaggingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [filterType]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await AdminService.files.list(filterType);
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-700/50 rounded-lg text-slate-300">
                        <FolderOpen size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Asset Library</h1>
                </div>
                <div className="flex gap-2">
                     <button className="flex items-center gap-2 px-4 py-2 bg-pidgey-panel border border-pidgey-border rounded-lg hover:bg-pidgey-border transition text-sm">
                        <Upload size={16} /> Upload
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-pidgey-panel border border-pidgey-border rounded-xl">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search files..." 
                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-pidgey-accent text-white"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {['all', AssetType.STAMP_ART, AssetType.CARD_TEMPLATE, AssetType.ICON].map(t => (
                        <button 
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap ${
                                filterType === t ? 'bg-pidgey-accent text-pidgey-dark' : 'bg-pidgey-dark text-pidgey-muted hover:text-white'
                            }`}
                        >
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="flex bg-pidgey-dark rounded-lg p-1 border border-pidgey-border">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}><Grid size={16}/></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}><List size={16}/></button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {files.map(file => (
                    <FileCard 
                        key={file.id} 
                        file={file} 
                        onAutoTag={handleAutoTag} 
                        isTagging={taggingId === file.id} 
                    />
                ))}
            </div>
        </div>
    );
};
