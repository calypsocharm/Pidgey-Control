import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Upload, Save, Loader, AlertTriangle, RefreshCw, Palette, LayoutTemplate, Plus, Type, Move, AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown, Wand2, Layers, Snowflake, CloudRain, Zap, MonitorPlay, Film, MousePointer2, X, Square } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { generateImageAsset } from '../services/geminiService';
import { Stamp, Asset, StampRarity, StampStatus } from '../types';

type StudioMode = 'stamps' | 'templates';

interface TextConfig {
    text: string;
    font: 'font-sans' | 'font-serif' | 'font-mono' | 'font-handwriting';
    size: number;
    color: string;
    shadowColor: string;
    align: 'text-left' | 'text-center' | 'text-right';
    posX: number; // Percentage 0-100
    posY: number; // Percentage 0-100
}

interface EffectConfig {
    type: 'none' | 'snow' | 'rain' | 'confetti' | 'glitch' | 'pulse' | 'holographic';
    intensity: number;
}

interface BorderConfig {
    color: string;
    thickness: number;
    style: 'dotted' | 'dashed' | 'solid' | 'double' | 'none';
}

const STYLE_PRESETS = [
    { id: 'none', label: 'No Style', prompt: '' },
    { id: 'vector', label: 'Vector Sticker', prompt: 'clean vector art, white border sticker style, flat colors, svg' },
    { id: 'pixel', label: 'Pixel Art', prompt: '16-bit pixel art, retro game style, vibrant' },
    { id: 'watercolor', label: 'Watercolor', prompt: 'soft watercolor painting, paper texture, gentle strokes, artistic' },
    { id: '3d', label: '3D Render', prompt: '3d clay render, isometric, cute, plastic texture, blender cycles' },
    { id: 'holo', label: 'Holographic', prompt: 'holographic foil texture, iridescent colors, shiny, metallic' },
    { id: 'neon', label: 'Neon Cyber', prompt: 'neon glowing lines, cyberpunk, dark background, synthwave' },
];

export const Playground = () => {
    // Mode State
    const [mode, setMode] = useState<StudioMode>('stamps');
    const [loading, setLoading] = useState(true);

    // Data State
    const [stamps, setStamps] = useState<Stamp[]>([]);
    const [templates, setTemplates] = useState<Asset[]>([]);
    
    // Selection State
    const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Asset | null>(null);
    
    // Editor State
    const [activeTab, setActiveTab] = useState<'art' | 'text' | 'fx'>('art');
    const [previewUrl, setPreviewUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Configuration State
    const [assetName, setAssetName] = useState('');
    const [showTextOverlay, setShowTextOverlay] = useState(true);
    const [textConfig, setTextConfig] = useState<TextConfig>({
        text: "Pidgey Post",
        font: 'font-handwriting',
        size: 24,
        color: '#ffffff',
        shadowColor: '#000000',
        align: 'text-center',
        posX: 50,
        posY: 50
    });
    const [effectConfig, setEffectConfig] = useState<EffectConfig>({
        type: 'none',
        intensity: 50
    });
    const [borderConfig, setBorderConfig] = useState<BorderConfig>({
        color: '#334155', // Slate-700 default
        thickness: 8,
        style: 'dotted'
    });
    
    // AI Input
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
    const [isAnimating, setIsAnimating] = useState(false); // Toggle for motion simulation
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [mode]);

    const loadData = async () => {
        setLoading(true);
        if (mode === 'stamps') {
            const { data } = await AdminService.stamps.list();
            setStamps(data);
            if (activeTab === 'text') setActiveTab('art'); // Reset tab
        } else {
            const { data } = await AdminService.files.list('templates');
            setTemplates(data);
        }
        setLoading(false);
    };

    // --- Selection Handlers ---

    const resetEditor = () => {
        setPreviewUrl('');
        setAssetName('');
        setEffectConfig({ type: 'none', intensity: 50 });
        setBorderConfig({ color: '#334155', thickness: 8, style: 'dotted' });
        setPrompt('');
        setIsAnimating(false);
    };

    const handleSelectStamp = (stamp: Stamp) => {
        resetEditor();
        setSelectedStamp(stamp);
        setSelectedTemplate(null);
        setPreviewUrl(stamp.art_path || '');
        setAssetName(stamp.name);
        setPrompt(`A ${stamp.rarity.toLowerCase()} stamp of a ${stamp.name}`);
        setActiveTab('art');
    };

    const handleNewStamp = () => {
        resetEditor();
        setSelectedStamp({
            id: 'new',
            name: 'New Stamp',
            rarity: StampRarity.COMMON,
            status: StampStatus.ACTIVE,
            price_eggs: 0,
            is_drop_only: false,
            art_path: '',
            collection: 'Playground'
        });
        setSelectedTemplate(null);
        setAssetName("New Stamp");
        setPrompt("A cute pigeon holding a letter...");
        setActiveTab('art');
    };

    const handleSelectTemplate = (template: Asset) => {
        resetEditor();
        setSelectedTemplate(template);
        setSelectedStamp(null);
        setPreviewUrl(template.url || '');
        setAssetName(template.name.split('.')[0]);
        setPrompt("A greeting card background...");
        setActiveTab('art');
    };

    const handleNewTemplate = () => {
        resetEditor();
        setSelectedTemplate({
            id: 'new',
            name: 'New Template',
            url: '',
            type: 'card_template' as any,
            size_kb: 0,
            tags: [],
            usage_count: 0,
            created_at: new Date().toISOString()
        });
        setAssetName("New Template");
        setPrompt("A floral birthday card border...");
        setActiveTab('art');
    };

    // --- Action Handlers ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const bucket = mode === 'stamps' ? 'stamps' : 'templates';
        const { data, error } = await AdminService.files.upload(file, bucket);
        
        if (data) {
            setPreviewUrl(data.url);
        } else {
            alert("Upload failed: " + error?.message);
        }
        setIsProcessing(false);
    };

    const handleGenerateAI = async () => {
        if (!prompt) return;
        setIsProcessing(true);
        try {
            // Construct enhanced prompt
            const stylePrompt = selectedStyle.prompt ? `, in the style of ${selectedStyle.prompt}` : '';
            const motionPrompt = isAnimating ? ', cinematic lighting, dynamic pose, sequence frame' : '';
            const fullPrompt = `${prompt}${stylePrompt}${motionPrompt}`;

            const base64 = await generateImageAsset(fullPrompt);
            if (base64) {
                // Determine mime type based on if we requested motion (mock logic for now)
                // In a real implementation with Veo, we'd handle .mp4 or .gif
                const bucket = mode === 'stamps' ? 'stamps' : 'templates';
                const { data, error } = await AdminService.files.uploadBase64(base64, bucket);
                
                if (data) {
                    setPreviewUrl(data.url);
                } else {
                     setPreviewUrl(`data:image/png;base64,${base64}`);
                }
            } else {
                alert("AI generation returned no image.");
            }
        } catch (e: any) {
            alert("Generation failed: " + e.message);
        }
        setIsProcessing(false);
    };

    const handleSave = async () => {
        if (!previewUrl) return;
        setIsProcessing(true);

        if (mode === 'stamps') {
            if (!selectedStamp) return;
            
            // If editing existing, update it. If new, create it.
            // Note: In this playground, we mostly just update the 'art_path' of the stamp entity
            // but keep the effect config local (in a real app, effectConfig would be saved to DB)
            const payload = {
                name: assetName,
                art_path: previewUrl,
                rarity: selectedStamp.rarity, // Preserve rarity
            };

            if (selectedStamp.id !== 'new') {
                 const { error } = await AdminService.stamps.update(selectedStamp.id, payload);
                 if (!error) {
                    setStamps(prev => prev.map(s => s.id === selectedStamp.id ? { ...s, ...payload } : s));
                    alert("Stamp updated successfully!");
                 }
            } else {
                 // Mock creation flow
                 alert(`New Stamp "${assetName}" drafted! Head to Drops to publish.`);
            }
        } else {
            // Templates
             alert("Template saved to library!");
        }
        setIsProcessing(false);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* INJECTED STYLES FOR FX */}
            <style>{`
                @keyframes snow { 0% { transform: translateY(-10px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
                .fx-snow { position: absolute; top: -10px; width: 100%; height: 100%; pointer-events: none; z-index: 20; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjIuNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg=='); animation: snow 10s linear infinite; }
                
                @keyframes glitch { 0% { transform: translate(0); } 20% { transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } 100% { transform: translate(0); } }
                .fx-glitch { animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite; }

                @keyframes pulse-slow { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.02); filter: brightness(1.1); } }
                .fx-pulse { animation: pulse-slow 3s ease-in-out infinite; }

                @keyframes holo { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
                .fx-holographic { animation: holo 8s linear infinite; mix-blend-mode: overlay; opacity: 0.5; }
            `}</style>

            {/* LEFT: Library */}
            <div className="w-72 bg-pidgey-panel border border-pidgey-border rounded-xl flex flex-col overflow-hidden">
                <div className="flex border-b border-pidgey-border">
                    <button onClick={() => setMode('stamps')} className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition ${mode === 'stamps' ? 'bg-pidgey-dark text-pidgey-accent border-b-2 border-pidgey-accent' : 'text-pidgey-muted'}`}>
                        <Palette size={16} /> Stamps
                    </button>
                    <button onClick={() => setMode('templates')} className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition ${mode === 'templates' ? 'bg-pidgey-dark text-pidgey-accent border-b-2 border-pidgey-accent' : 'text-pidgey-muted'}`}>
                        <LayoutTemplate size={16} /> Templates
                    </button>
                </div>
                
                <div className="p-2 bg-pidgey-dark border-b border-pidgey-border flex justify-between items-center">
                    <span className="text-[10px] font-bold text-pidgey-muted uppercase pl-2">Library Assets</span>
                    <button onClick={loadData}><RefreshCw size={12} className="text-pidgey-muted hover:text-white"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-pidgey-panel scrollbar-thin">
                    {mode === 'stamps' ? (
                         <>
                            <button onClick={handleNewStamp} className="w-full p-2 rounded-lg border border-dashed border-pidgey-border hover:border-pidgey-accent hover:bg-pidgey-dark/50 flex items-center gap-3 group transition-all">
                                <div className="w-10 h-10 rounded bg-pidgey-dark flex items-center justify-center text-pidgey-muted group-hover:text-pidgey-accent"><Plus size={20} /></div>
                                <span className="text-xs font-bold text-pidgey-muted group-hover:text-white">Create New Stamp</span>
                            </button>
                            {stamps.map(s => (
                                <div key={s.id} onClick={() => handleSelectStamp(s)} className={`p-2 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${selectedStamp?.id === s.id ? 'bg-pidgey-dark border-pidgey-accent ring-1 ring-pidgey-accent' : 'bg-pidgey-dark/50 border-pidgey-border hover:border-pidgey-muted'}`}>
                                    <div className="w-10 h-12 rounded bg-black/40 flex items-center justify-center border border-pidgey-border overflow-hidden">
                                        {s.art_path ? <img src={s.art_path} className="w-full h-full object-contain" /> : <ImageIcon size={14} className="text-pidgey-muted"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-xs truncate">{s.name}</div>
                                        <div className="text-[10px] text-pidgey-muted">{s.rarity}</div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                         <>
                            <button onClick={handleNewTemplate} className="w-full p-2 rounded-lg border border-dashed border-pidgey-border hover:border-pidgey-accent hover:bg-pidgey-dark/50 flex items-center gap-3 group transition-all">
                                <div className="w-10 h-10 rounded bg-pidgey-dark flex items-center justify-center text-pidgey-muted group-hover:text-pidgey-accent"><Plus size={20} /></div>
                                <span className="text-xs font-bold text-pidgey-muted group-hover:text-white">Create New Template</span>
                            </button>
                            {templates.map(t => (
                                <div key={t.id} onClick={() => handleSelectTemplate(t)} className={`p-2 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${selectedTemplate?.id === t.id ? 'bg-pidgey-dark border-pidgey-accent ring-1 ring-pidgey-accent' : 'bg-pidgey-dark/50 border-pidgey-border hover:border-pidgey-muted'}`}>
                                    <div className="w-10 h-12 rounded bg-black/40 flex items-center justify-center border border-pidgey-border overflow-hidden">
                                        {t.url ? <img src={t.url} className="w-full h-full object-cover" /> : <LayoutTemplate size={14} className="text-pidgey-muted"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-xs truncate">{t.name}</div>
                                        <div className="text-[10px] text-pidgey-muted">{(t.size_kb/1024).toFixed(1)} MB</div>
                                    </div>
                                </div>
                            ))}
                         </>
                    )}
                </div>
            </div>

            {/* CENTER: Canvas Stage */}
            <div className="flex-1 bg-pidgey-dark border border-pidgey-border rounded-xl flex flex-col relative overflow-hidden">
                {!selectedStamp && !selectedTemplate ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-pidgey-muted">
                        <Wand2 size={48} className="mb-4 opacity-20" />
                        <h2 className="text-xl font-bold">Creative Studio</h2>
                        <p>Select an asset to begin designing.</p>
                    </div>
                ) : (
                    <>
                        {/* Toolbar Header */}
                        <div className="h-16 border-b border-pidgey-border bg-pidgey-panel px-6 flex items-center justify-between">
                             <div>
                                <input 
                                    value={assetName} 
                                    onChange={(e) => setAssetName(e.target.value)}
                                    className="bg-transparent text-lg font-bold text-white focus:outline-none placeholder-pidgey-muted"
                                    placeholder="Asset Name"
                                />
                                <div className="flex gap-2 text-[10px] uppercase font-bold text-pidgey-muted mt-1">
                                    <span>{mode === 'stamps' ? 'Stamp Entity' : 'Card Template'}</span>
                                    <span>•</span>
                                    <span>{effectConfig.type !== 'none' ? `FX: ${effectConfig.type}` : 'Static'}</span>
                                </div>
                             </div>
                             <button 
                                onClick={handleSave}
                                disabled={isProcessing || !previewUrl}
                                className="px-6 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition flex items-center gap-2 shadow-lg hover:shadow-teal-400/20 disabled:opacity-50"
                             >
                                <Save size={18} /> Save Asset
                            </button>
                        </div>

                        {/* Canvas Area */}
                        <div className="flex-1 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] relative flex items-center justify-center overflow-hidden p-8">
                            
                            {/* THE COMPOSITION LAYER */}
                            <div className={`relative transition-all duration-300 shadow-2xl ${
                                mode === 'stamps' 
                                ? `w-[360px] h-[480px] ${effectConfig.type === 'pulse' ? 'fx-pulse' : ''} ${effectConfig.type === 'glitch' ? 'fx-glitch' : ''}` // Stamp Ratio 3:4
                                : `w-[400px] h-[560px]` // Card Ratio
                            }`}>
                                {/* 1. Base Art Layer */}
                                <div 
                                    style={mode === 'stamps' ? { 
                                        borderColor: borderConfig.color, 
                                        borderWidth: `${borderConfig.thickness}px`, 
                                        borderStyle: borderConfig.style 
                                    } : {}}
                                    className={`absolute inset-0 bg-white overflow-hidden ${mode === 'stamps' ? 'rounded-xl bg-pidgey-panel' : 'rounded-lg shadow-md'}`}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} className={`w-full h-full ${mode === 'stamps' ? 'object-contain p-4' : 'object-cover'}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                                            <ImageIcon size={48} className="opacity-50" />
                                        </div>
                                    )}
                                </div>

                                {/* 2. Effects Layer (Overlay) */}
                                {effectConfig.type === 'snow' && <div className="fx-snow pointer-events-none rounded-xl" />}
                                {effectConfig.type === 'rain' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 pointer-events-none mix-blend-overlay" />}
                                {effectConfig.type === 'holographic' && <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-blue-500/20 to-green-500/20 fx-holographic pointer-events-none rounded-xl" />}

                                {/* 3. Text Layer (Draggable Simulation) */}
                                {showTextOverlay && (
                                    <div 
                                        className={`absolute pointer-events-none`}
                                        style={{ 
                                            left: `${textConfig.posX}%`, 
                                            top: `${textConfig.posY}%`,
                                            transform: 'translate(-50%, -50%)',
                                            width: '100%',
                                            textAlign: textConfig.align === 'text-left' ? 'left' : textConfig.align === 'text-right' ? 'right' : 'center'
                                        }}
                                    >
                                        <h2 
                                            style={{ 
                                                color: textConfig.color, 
                                                fontSize: `${textConfig.size}px`,
                                                textShadow: `2px 2px 0px ${textConfig.shadowColor}`
                                            }}
                                            className={`${textConfig.font} font-bold whitespace-pre-wrap leading-tight drop-shadow-lg`}
                                        >
                                            {textConfig.text}
                                        </h2>
                                    </div>
                                )}

                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm z-50 rounded-xl">
                                        <Loader className="animate-spin mb-3 text-pidgey-accent" size={40} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Rendering...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* RIGHT: Inspector Panel */}
            {selectedStamp || selectedTemplate ? (
                <div className="w-80 bg-pidgey-panel border border-pidgey-border rounded-xl flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-pidgey-border bg-pidgey-dark">
                        <button onClick={() => setActiveTab('art')} className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${activeTab === 'art' ? 'text-pidgey-accent border-b-2 border-pidgey-accent bg-pidgey-panel' : 'text-pidgey-muted hover:text-white'}`}>
                            <ImageIcon size={16} /> Base Art
                        </button>
                        <button onClick={() => setActiveTab('text')} className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${activeTab === 'text' ? 'text-pidgey-accent border-b-2 border-pidgey-accent bg-pidgey-panel' : 'text-pidgey-muted hover:text-white'}`}>
                            <Type size={16} /> Typography
                        </button>
                        <button onClick={() => setActiveTab('fx')} className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${activeTab === 'fx' ? 'text-pidgey-accent border-b-2 border-pidgey-accent bg-pidgey-panel' : 'text-pidgey-muted hover:text-white'}`}>
                            <Sparkles size={16} /> FX & GIF
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        
                        {/* TAB: BASE ART */}
                        {activeTab === 'art' && (
                            <div className="space-y-6">
                                {/* Upload Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Upload size={14} className="text-pidgey-accent"/> Manual Upload</h3>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*, image/gif" onChange={handleFileUpload} />
                                    <div onClick={() => fileInputRef.current?.click()} className="h-24 border border-dashed border-pidgey-border rounded-lg flex flex-col items-center justify-center text-pidgey-muted hover:border-pidgey-accent hover:text-white cursor-pointer hover:bg-pidgey-dark transition">
                                        <Upload size={20} className="mb-2" />
                                        <span className="text-[10px] font-bold uppercase">Click to Browse</span>
                                        <span className="text-[9px] opacity-60">PNG, JPG, GIF supported</span>
                                    </div>
                                </div>

                                {mode === 'stamps' && (
                                    <>
                                        <div className="h-px bg-pidgey-border" />
                                        <div>
                                             <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Square size={14} className="text-pidgey-accent"/> Stamp Border</h3>
                                             <div className="space-y-3">
                                                 <div className="grid grid-cols-2 gap-3">
                                                     <div>
                                                         <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Color</label>
                                                         <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1.5">
                                                            <input type="color" value={borderConfig.color} onChange={e => setBorderConfig({...borderConfig, color: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                                                            <span className="text-[10px] font-mono text-white">{borderConfig.color}</span>
                                                        </div>
                                                     </div>
                                                     <div>
                                                         <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Thickness</label>
                                                         <input type="number" value={borderConfig.thickness} onChange={e => setBorderConfig({...borderConfig, thickness: parseInt(e.target.value)})} className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-xs text-white" />
                                                     </div>
                                                 </div>
                                                 <div>
                                                    <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Style</label>
                                                    <select value={borderConfig.style} onChange={e => setBorderConfig({...borderConfig, style: e.target.value as any})} className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-xs text-white">
                                                        <option value="dotted">Dotted</option>
                                                        <option value="dashed">Dashed</option>
                                                        <option value="solid">Solid</option>
                                                        <option value="double">Double</option>
                                                        <option value="none">None</option>
                                                    </select>
                                                 </div>
                                             </div>
                                        </div>
                                    </>
                                )}

                                <div className="h-px bg-pidgey-border" />

                                {/* Gen AI Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Wand2 size={14} className="text-pidgey-secondary"/> Generative Studio v2</h3>
                                    
                                    <div className="mb-3">
                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Style Preset</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {STYLE_PRESETS.map(style => (
                                                <button 
                                                    key={style.id}
                                                    onClick={() => setSelectedStyle(style)}
                                                    className={`px-2 py-1.5 rounded text-[10px] font-bold border transition ${selectedStyle.id === style.id ? 'bg-pidgey-secondary text-white border-pidgey-secondary' : 'bg-pidgey-dark text-pidgey-muted border-pidgey-border hover:border-pidgey-muted'}`}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Magic Prompt</label>
                                        <textarea 
                                            value={prompt}
                                            onChange={e => setPrompt(e.target.value)}
                                            className="w-full h-24 bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-xs focus:border-pidgey-secondary outline-none resize-none text-white"
                                            placeholder="Describe your vision..."
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3 bg-pidgey-dark p-2 rounded border border-pidgey-border">
                                        <input 
                                            type="checkbox" 
                                            id="animate" 
                                            checked={isAnimating} 
                                            onChange={e => setIsAnimating(e.target.checked)} 
                                            className="rounded border-pidgey-border bg-pidgey-panel text-pidgey-secondary focus:ring-pidgey-secondary"
                                        />
                                        <label htmlFor="animate" className="text-xs font-bold text-white cursor-pointer flex items-center gap-2">
                                            <Film size={12} /> Generate as GIF / Motion
                                        </label>
                                    </div>

                                    <button 
                                        onClick={handleGenerateAI}
                                        disabled={isProcessing || !prompt}
                                        className="w-full py-2.5 bg-gradient-to-r from-pidgey-secondary to-purple-600 text-white font-bold rounded-lg hover:brightness-110 transition flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Sparkles size={14} /> Generate Masterpiece
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB: TYPOGRAPHY */}
                        {activeTab === 'text' && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-white uppercase">Text Layer</h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={showTextOverlay} onChange={e => setShowTextOverlay(e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-pidgey-dark border border-pidgey-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-pidgey-muted after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pidgey-accent peer-checked:after:bg-white"></div>
                                    </label>
                                </div>

                                <textarea 
                                    value={textConfig.text}
                                    onChange={e => setTextConfig({...textConfig, text: e.target.value})}
                                    className="w-full h-20 bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-sm focus:border-pidgey-accent outline-none text-white"
                                    placeholder="Enter text..."
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Font</label>
                                        <select 
                                            value={textConfig.font}
                                            onChange={e => setTextConfig({...textConfig, font: e.target.value as any})}
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-xs text-white"
                                        >
                                            <option value="font-handwriting">Dancing Script</option>
                                            <option value="font-sans">Inter Sans</option>
                                            <option value="font-serif">Merriweather</option>
                                            <option value="font-mono">JetBrains Mono</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Size</label>
                                        <input 
                                            type="number" 
                                            value={textConfig.size}
                                            onChange={e => setTextConfig({...textConfig, size: parseInt(e.target.value)})}
                                            className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-xs text-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Color</label>
                                        <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1.5">
                                            <input type="color" value={textConfig.color} onChange={e => setTextConfig({...textConfig, color: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                                            <span className="text-[10px] font-mono text-white">{textConfig.color}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Shadow</label>
                                        <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1.5">
                                            <input type="color" value={textConfig.shadowColor} onChange={e => setTextConfig({...textConfig, shadowColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                                            <span className="text-[10px] font-mono text-white">{textConfig.shadowColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-2 block flex items-center gap-2"><MousePointer2 size={12}/> Position (X / Y)</label>
                                    <div className="space-y-3 bg-pidgey-dark p-3 rounded-lg border border-pidgey-border">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] w-4 text-pidgey-muted">X</span>
                                            <input 
                                                type="range" min="0" max="100" 
                                                value={textConfig.posX} 
                                                onChange={e => setTextConfig({...textConfig, posX: parseInt(e.target.value)})} 
                                                className="flex-1 h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] w-4 text-pidgey-muted">Y</span>
                                            <input 
                                                type="range" min="0" max="100" 
                                                value={textConfig.posY} 
                                                onChange={e => setTextConfig({...textConfig, posY: parseInt(e.target.value)})} 
                                                className="flex-1 h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: FX & GIF */}
                        {activeTab === 'fx' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><MonitorPlay size={14} className="text-green-400"/> Animation Engine</h3>
                                    <p className="text-[10px] text-pidgey-muted mb-3">Apply CSS-based motion effects to your assets.</p>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'none', label: 'None', icon: X },
                                            { id: 'snow', label: 'Snowfall', icon: Snowflake },
                                            { id: 'rain', label: 'Rain', icon: CloudRain },
                                            { id: 'confetti', label: 'Confetti', icon: Sparkles },
                                            { id: 'glitch', label: 'Glitch', icon: Zap },
                                            { id: 'pulse', label: 'Pulse', icon: Layers },
                                            { id: 'holographic', label: 'Holo Foil', icon: Sparkles },
                                        ].map((fx) => (
                                            <button
                                                key={fx.id}
                                                onClick={() => setEffectConfig({ ...effectConfig, type: fx.id as any })}
                                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition ${
                                                    effectConfig.type === fx.id 
                                                    ? 'bg-pidgey-accent/20 border-pidgey-accent text-pidgey-accent' 
                                                    : 'bg-pidgey-dark border-pidgey-border text-pidgey-muted hover:text-white hover:border-white/50'
                                                }`}
                                            >
                                                {/* @ts-ignore */}
                                                <fx.icon size={20} />
                                                <span className="text-[10px] font-bold uppercase">{fx.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {effectConfig.type !== 'none' && (
                                    <div className="bg-pidgey-dark p-3 rounded-lg border border-pidgey-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-pidgey-muted uppercase">Effect Intensity</span>
                                            <span className="text-[10px] font-mono text-white">{effectConfig.intensity}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={effectConfig.intensity} 
                                            onChange={e => setEffectConfig({...effectConfig, intensity: parseInt(e.target.value)})} 
                                            className="w-full h-1 bg-pidgey-border rounded-lg appearance-none cursor-pointer accent-pidgey-accent"
                                        />
                                    </div>
                                )}

                                <div className="p-3 bg-yellow-900/10 border border-yellow-700/30 rounded text-xs text-yellow-500">
                                    <h4 className="font-bold flex items-center gap-2 mb-1"><AlertTriangle size={12}/> Pro Tip</h4>
                                    <p className="opacity-80">Effects are rendered via CSS. If you save a static image, effects won't bake in unless you use the "Generate as GIF" option in AI tools.</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            ) : (
                <div className="w-80 bg-pidgey-dark/30 border border-dashed border-pidgey-border rounded-xl flex items-center justify-center text-pidgey-muted p-6 text-center">
                    <p className="text-xs">Select an item to open Inspector</p>
                </div>
            )}
        </div>
    );
};