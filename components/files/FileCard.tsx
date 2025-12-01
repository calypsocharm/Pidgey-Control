
import React, { useState } from 'react';
import { FileText, Download, Trash2, Sparkles, Plus, AlertTriangle } from 'lucide-react';
import { Asset, AssetType } from '../../types';

interface FileCardProps {
    file: Asset;
    onAutoTag: (file: Asset) => void;
    isTagging: boolean;
    onDelete: (file: Asset) => void;
    isSafeMode: boolean;
    onSelect?: (file: Asset) => void;
    isStamp?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onAutoTag, isTagging, onDelete, isSafeMode, onSelect, isStamp }) => {
    const [imgError, setImgError] = useState(false);

    // Apply stamp style if isStamp is true
    // Logic: White container, Dotted border colored to match the parent background (pidgey-dark)
    const containerClasses = isStamp 
        ? "aspect-[3/4] bg-white border-[6px] border-dotted border-pidgey-dark p-1 rounded-sm"
        : "aspect-[3/4] bg-pidgey-dark p-4";

    return (
        <div className={`group bg-pidgey-panel ${isStamp ? 'border border-pidgey-border' : 'border border-pidgey-border'} rounded-xl overflow-hidden hover:border-pidgey-muted transition-colors relative`}>
            {/* Image Container */}
            <div className={`relative overflow-hidden flex items-center justify-center ${containerClasses}`}>
                {file.type === AssetType.IMAGE || file.type === AssetType.STAMP_ART || file.type === AssetType.ICON || file.type === AssetType.CARD_TEMPLATE ? (
                    imgError ? (
                        <div className="flex flex-col items-center text-red-400">
                             <AlertTriangle size={24} className="mb-2" />
                             <span className="text-[10px] font-bold uppercase">Broken Link</span>
                        </div>
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center overflow-hidden ${isStamp ? 'bg-slate-100' : ''}`}>
                            <img 
                                src={file.url} 
                                alt={file.name} 
                                className={`w-full h-full object-contain transition-transform group-hover:scale-105 ${isStamp ? 'object-cover' : ''}`}
                                onError={() => setImgError(true)}
                            />
                        </div>
                    )
                ) : (
                    <FileText size={48} className="text-pidgey-muted opacity-20" />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-2 content-center z-10">
                    {/* Auto Tag */}
                    <button 
                        onClick={() => onAutoTag(file)}
                        disabled={isTagging}
                        className="p-2 bg-pidgey-accent/20 hover:bg-pidgey-accent/40 rounded-full text-pidgey-accent backdrop-blur transition-colors" 
                        title="AI Auto Tag"
                    >
                        <Sparkles size={18} className={isTagging ? 'animate-spin' : ''} />
                    </button>
                    
                    {/* Create Entity Shortcut */}
                    {onSelect && !imgError && (
                        <button 
                            onClick={() => onSelect(file)}
                            className="p-2 bg-pidgey-accent text-pidgey-dark rounded-full font-bold hover:bg-teal-300 transition-colors shadow-lg shadow-teal-500/20"
                            title="Create Database Entry from this File"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    )}

                    {/* Download */}
                    <a href={file.url} target="_blank" rel="noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition-colors" title="Download File">
                        <Download size={18}/>
                    </a>
                    
                    {/* Delete */}
                    <button 
                        onClick={() => onDelete(file)}
                        className={`p-2 rounded-full backdrop-blur transition-colors ${isSafeMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        title="Delete File Permanently"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>
            
            <div className="p-3 border-t border-pidgey-border bg-pidgey-panel relative z-10">
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
};
