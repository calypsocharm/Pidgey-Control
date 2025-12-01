
import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Upload, Save, Loader, RefreshCw, Palette, LayoutTemplate, Plus, Type, Film, X, Square, Copy, Download, Zap, Wand2, Layers, Snowflake, CloudRain, MonitorPlay, Move, ZoomIn, Scaling, FolderOpen, ChevronRight, Bird, Send as SendIcon, Database, HardDrive } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { generateImageAsset, generateStampName } from '../services/geminiService';
import { Stamp, Asset, StampRarity, StampStatus, BorderConfig, TextConfig, EffectConfig, ArtConfig } from '../types';
import { useLocation } from 'react-router-dom';
import { useJarvis } from '../JarvisContext';
import { BorderEditor } from './studio/BorderEditor';
import { ArtControls } from './studio/ArtControls';
import { TextEditor } from './studio/TextEditor';
import { EffectsEditor } from './studio/EffectsEditor';

type StudioMode = 'stamps' | 'templates';

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
    
    // File Storage State (for Load Asset Modal)
    const [storageFiles, setStorageFiles] = useState<Asset[]>([]);
    const [loadTab, setLoadTab] = useState<'database' | 'storage'>('database');
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Selection State
    const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Asset | null>(null);
    
    // Editor State
    const [activeTab, setActiveTab] = useState<'art' | 'text' | 'fx'>('art');
    const [previewUrl, setPreviewUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Load Asset Modal State
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    
    // Configuration State
    const [assetName, setAssetName] = useState('');
    const [showTextOverlay, setShowTextOverlay] = useState(true);
    
    const [textConfig, setTextConfig] = useState<TextConfig>({
        text: "",
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
        intensity: 80
    });
    
    const [borderConfig, setBorderConfig] = useState<BorderConfig>({
        enabled: true,
        color: '#ffffff',
        thickness: 12,
        style: 'perforated',
        radius: 4,
        glowColor: '#ffffff',
        glowIntensity: 0,
        material: 'none',
        innerColor: '#cbd5e1', // Slate 300
        innerThickness: 2
    });

    const [artConfig, setArtConfig] = useState<ArtConfig>({
        scale: 1,
        x: 0,
        y: 0
    });
    
    // AI Input
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();

    // Jarvis Context for "Save to Creations"
    const { addCreation, openPidgey } = useJarvis();

    useEffect(() => {
        loadData();
    }, [mode]);

    // Handle seamless navigation from Drops Inventory OR Files
    useEffect(() => {
        if (location.state?.loadStamp) {
            handleSelectStamp(location.state.loadStamp);
            // Clear state to avoid reload loops if needed, though React Router handles this well
            window.history.replaceState({}, '');
        } else if (location.state?.loadFile) {
            handleSelectRawFile(location.state.loadFile);
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    // Fetch storage files when switching to that tab
    useEffect(() => {
        if (isLoadModalOpen && loadTab === 'storage' && storageFiles.length === 0) {
            loadStorageFiles();
        }
    }, [isLoadModalOpen, loadTab]);

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

    const loadStorageFiles = async () => {
        setLoadingFiles(true);
        const { data } = await AdminService.files.list('stamps');
        setStorageFiles(data);
        setLoadingFiles(false);
    };

    // --- Selection Handlers ---

    const resetEditor = () => {
        setPreviewUrl('');
        setAssetName('');
        setEffectConfig({ type: 'none', intensity: 80 });
        // Default to a nice perforated look for stamps
        setBorderConfig({ 
            enabled: true, 
            color: '#ffffff', 
            thickness: 12, 
            style: 'perforated', 
            radius: 4, 
            glowColor: '#ffffff', 
            glowIntensity: 0, 
            material: 'none',
            innerColor: '#cbd5e1',
            innerThickness: 2
        });
        setArtConfig({ scale: 1, x: 0, y: 0 });
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
        
        // Restore Design Config if available
        if (stamp.design_config) {
            restoreDesignConfig(stamp.design_config);
        }
        
        setActiveTab('art');
    };

    const handleSelectRawFile = (file: Asset) => {
        resetEditor();
        // Create a "New Stamp" shell around this file
        setSelectedStamp({
            id: 'new',
            name: file.name.split('.')[0].replace(/[_-]/g, ' '),
            rarity: StampRarity.COMMON,
            status: StampStatus.DRAFT,
            price_eggs: 0,
            is_drop_only: false,
            art_path: file.url,
            collection: 'Playground'
        });
        setSelectedTemplate(null);
        setPreviewUrl(file.url);
        setAssetName(file.name.split('.')[0].replace(/[_-]/g, ' '));
        setPrompt("A new stamp design...");
        setActiveTab('art');
    };

    const handleNewStamp = () => {
        resetEditor();
        setSelectedStamp({
            id: 'new',
            name: 'New Stamp',
            rarity: StampRarity.COMMON,
            status: StampStatus.DRAFT,
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
    
    const restoreDesignConfig = (config: any) => {
        if (config.border) setBorderConfig(config.border);
        if (config.text) setTextConfig(config.text);
        if (config.effect) setEffectConfig(config.effect);
        if (config.art) setArtConfig(config.art);
        if (config.showTextOverlay !== undefined) setShowTextOverlay(config.showTextOverlay);
        if (config.prompt) setPrompt(config.prompt);
        if (config.stylePreset) setSelectedStyle(config.stylePreset);
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
        const folder = mode === 'stamps' ? 'public_stamps' : undefined;

        const { data, error } = await AdminService.files.upload(file, bucket, folder);
        
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
            const stylePrompt = selectedStyle.prompt ? `, in the style of ${selectedStyle.prompt}` : '';
            const motionPrompt = isAnimating ? ', cinematic lighting, dynamic pose, sequence frame' : '';
            // FORCE FULL BLEED
            const fullPrompt = `${prompt}, full bleed, detailed art that fills the entire frame${stylePrompt}${motionPrompt}`;

            const base64 = await generateImageAsset(fullPrompt);
            if (base64) {
                const bucket = mode === 'stamps' ? 'stamps' : 'templates';
                const folder = mode === 'stamps' ? 'public_stamps' : undefined;
                
                const { data } = await AdminService.files.uploadBase64(base64, bucket, folder);
                
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

    const handleAutoName = async () => {
        if (!selectedStamp) return;
        setIsProcessing(true);
        const name = await generateStampName({
            rarity: selectedStamp.rarity,
            material: borderConfig.material,
            style: borderConfig.style,
            visualPrompt: prompt || "Unknown visual"
        });
        setAssetName(name);
        setIsProcessing(false);
    };

    // Helper to gather config state
    const getDesignPayload = () => {
         return {
            border: borderConfig,
            text: textConfig,
            effect: effectConfig,
            art: artConfig,
            showTextOverlay: showTextOverlay,
            prompt: prompt,
            stylePreset: selectedStyle
        };
    };

    const handleSaveDirectly = async () => {
        if (!selectedStamp || !previewUrl) return;
        setIsProcessing(true);

        const payload = {
            name: assetName || selectedStamp.name,
            art_path: previewUrl,
            rarity: selectedStamp.rarity,
            status: selectedStamp.status, // Keep existing status
            design_config: getDesignPayload()
        };

        if (selectedStamp.id !== 'new') {
             const { error } = await AdminService.stamps.update(selectedStamp.id, payload);
             if (!error) {
                setStamps(prev => prev.map(s => s.id === selectedStamp.id ? { ...s, ...payload } : s));
                alert("Changes saved to database.");
             } else {
                 alert("Save failed: " + error.message);
             }
        }
        setIsProcessing(false);
    };

    const handleSendToPidgey = async () => {
        if (!selectedStamp || !previewUrl) return;
        setIsProcessing(true);
        
        // Auto-Name on Save if still generic
        let finalName = assetName;
        if (finalName === 'New Stamp' || !finalName) {
            try {
                 finalName = await generateStampName({
                    rarity: selectedStamp.rarity,
                    material: borderConfig.material,
                    style: borderConfig.style,
                    visualPrompt: prompt || "Unknown visual"
                });
                setAssetName(finalName);
            } catch(e) {
                console.error("Auto-name on save failed", e);
            }
        }

        const payload = {
            name: finalName,
            art_path: previewUrl,
            rarity: selectedStamp.rarity,
            status: StampStatus.DRAFT, 
            design_config: getDesignPayload(),
            collection: selectedStamp.collection || 'Playground'
        };

        // Create a new draft in Pidgey Creations
        addCreation({
             id: `draft_stamp_${Date.now()}`,
             type: 'stamp',
             summary: `Draft Stamp: ${finalName}`,
             data: payload,
             status: 'pending',
             created_at: new Date().toISOString()
         });

         resetEditor();
         setSelectedStamp(null);
         setStamps([]); // Refresh logic
         
         openPidgey(`I've grabbed your design for "${finalName}"! It's safely in the **Pidgey Creations** tab.\n\nPlease go there to review the Rarity and finalize it for your Inventory. Chirp! 🎨`);
         setIsProcessing(false);
    };

    const copyBorderStyle = () => {
        const json = JSON.stringify(borderConfig);
        navigator.clipboard.writeText(json);
        alert("Border style copied to clipboard!");
    };

    const pasteBorderStyle = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const config = JSON.parse(text);
            if (config.thickness !== undefined && config.radius !== undefined) {
                setBorderConfig(config);
            } else {
                alert("Invalid border style JSON.");
            }
        } catch (e) {
            alert("Could not paste style.");
        }
    };

    // --- Material CSS Generators ---
    const getMaterialStyle = (config: BorderConfig, canvasBg: string) => {
        const baseStyle: React.CSSProperties = {
            borderRadius: `${config.radius}px`,
        };

        // --- Perforated Logic (Inverse Dot Trick) ---
        if (config.style === 'perforated') {
            const bg = config.material !== 'none' ? getMaterialBackground(config.material) : config.color;
            // ART CONTAINMENT LOGIC
            const safePadding = Math.max(4, config.thickness / 2 + 2); 
            
            return {
                ...baseStyle,
                background: bg,
                // The border matches the container BG (bg) to look like holes.
                border: `${config.thickness}px dotted ${canvasBg}`,
                backgroundClip: 'padding-box', // CRITICAL FIX: Stops bg inside border, allowing dots to reveal canvasBg
                boxShadow: 'none',
                filter: config.glowIntensity > 0 ? `drop-shadow(0 0 ${config.glowIntensity}px ${config.glowColor})` : 'none',
                padding: `${safePadding}px`
            };
        }

        if (config.style !== 'solid') {
             return {
                 ...baseStyle,
                 border: `${config.thickness}px ${config.style} ${config.color}`,
                 background: 'transparent',
                 padding: 0,
                 boxShadow: config.glowIntensity > 0 ? `0 0 ${config.glowIntensity}px ${config.glowColor}, 0 0 ${config.glowIntensity / 2}px ${config.glowColor} inset` : 'none',
             };
        }

        const materialBg = config.material !== 'none' ? getMaterialBackground(config.material) : config.color;
        
        return { 
            ...baseStyle, 
            background: materialBg,
            padding: `${config.thickness}px`,
            boxShadow: config.glowIntensity > 0 ? `0 0 ${config.glowIntensity}px ${config.glowColor}, 0 0 ${config.glowIntensity / 2}px ${config.glowColor} inset` : 'none',
        };
    };

    const getMaterialBackground = (material: string) => {
        switch (material) {
            case 'gold': return 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)';
            case 'silver': return 'linear-gradient(135deg, #e0e0e0, #ffffff, #a0a0a0, #ffffff, #c0c0c0)';
            case 'neon': return 'linear-gradient(135deg, #ff00cc, #333399)';
            case 'holo': return 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';
            default: return 'white';
        }
    };

    const CANVAS_BG_COLOR = '#0f172a'; // pidgey-dark

    // Dynamic Classes for Effects
    const getEffectClass = () => {
        switch(effectConfig.type) {
            case 'glitch': return 'fx-glitch';
            case 'glowing': return 'fx-glowing';
            case '3d': return 'fx-3d';
            default: return '';
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            <style>{`
                /* FOIL */
                .fx-foil {
                    background: linear-gradient(45deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%);
                    background-size: 200% 200%;
                    mix-blend-mode: soft-light;
                    pointer-events: none;
                }

                /* HOLO FOIL (Iridescent) */
                @keyframes holo-move {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 200% 200%; }
                }
                .fx-holo-foil {
                    background: linear-gradient(135deg, 
                        rgba(255,0,0,0) 0%, 
                        rgba(255,0,0,0.4) 10%, 
                        rgba(255,255,0,0.4) 20%, 
                        rgba(0,255,0,0.4) 30%, 
                        rgba(0,255,255,0.4) 40%, 
                        rgba(0,0,255,0.4) 50%, 
                        rgba(255,0,255,0.4) 60%, 
                        rgba(255,0,0,0) 70%
                    );
                    background-size: 300% 300%;
                    mix-blend-mode: color-dodge;
                    animation: holo-move 4s linear infinite;
                    pointer-events: none;
                }

                /* SPARKLES */
                @keyframes sparkle-fade {
                    0%, 100% { opacity: 0; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                .fx-sparkles {
                    background-image: 
                        radial-gradient(white 1px, transparent 2px),
                        radial-gradient(white 1px, transparent 2px),
                        radial-gradient(white 2px, transparent 3px);
                    background-size: 50px 50px, 70px 70px, 90px 90px;
                    background-position: 0 0, 30px 30px, 15px 50px;
                    animation: sparkle-fade 2s ease-in-out infinite;
                    mix-blend-mode: screen;
                    pointer-events: none;
                }

                /* SHIMMER (Light Sweep) */
                @keyframes shimmer-sweep {
                    0% { transform: translateX(-150%) skewX(-25deg); }
                    100% { transform: translateX(250%) skewX(-25deg); }
                }
                .fx-shimmer::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; width: 50%; height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent);
                    transform: translateX(-150%) skewX(-25deg);
                    animation: shimmer-sweep 2.5s infinite;
                    pointer-events: none;
                    mix-blend-mode: overlay;
                }

                /* GLITCH */
                @keyframes glitch-anim {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
                .fx-glitch { 
                    animation: glitch-anim 0.3s infinite;
                    filter: hue-rotate(90deg) contrast(1.2);
                }

                /* 3D POP */
                .fx-3d {
                    transform: perspective(800px) rotateX(10deg) rotateY(-10deg);
                    box-shadow: -20px 20px 30px rgba(0,0,0,0.5) !important;
                }

                /* GLOWING */
                @keyframes neon-pulse {
                    0%, 100% { box-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073; }
                    50% { box-shadow: 0 0 15px #fff, 0 0 25px #ff00de, 0 0 40px #ff00de; }
                }
                .fx-glowing {
                    animation: neon-pulse 2s infinite alternate;
                }
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
                        <div className="h-16 border-b border-pidgey-border bg-pidgey-panel px-6 flex items-center justify-between z-10">
                             <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input 
                                        value={assetName} 
                                        onChange={(e) => setAssetName(e.target.value)}
                                        className="bg-transparent text-lg font-bold text-white focus:outline-none placeholder-pidgey-muted pr-8"
                                        placeholder="Asset Name"
                                    />
                                    {mode === 'stamps' && (
                                        <button 
                                            onClick={handleAutoName}
                                            disabled={isProcessing}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-pidgey-muted hover:text-pidgey-accent"
                                            title="Auto-Name with Pidgey AI"
                                        >
                                            <Sparkles size={16} className={isProcessing ? 'animate-spin' : ''} />
                                        </button>
                                    )}
                                </div>
                                <div className="h-8 w-px bg-pidgey-border mx-2"></div>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] uppercase font-bold ${mode === 'stamps' ? 'text-pidgey-accent' : 'text-blue-400'}`}>
                                        {mode === 'stamps' ? 'Stamp Studio (3:4)' : 'Template Studio (16:9)'}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-pidgey-muted">{effectConfig.type !== 'none' ? `FX: ${effectConfig.type}` : 'Static'}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                 {mode === 'stamps' && (
                                     <>
                                         <button 
                                            onClick={() => setIsLoadModalOpen(true)}
                                            className="flex items-center gap-2 text-pidgey-muted hover:text-white px-3 py-1.5 border border-pidgey-border rounded-lg bg-pidgey-dark text-xs font-bold uppercase transition"
                                         >
                                             <FolderOpen size={14} /> Load Asset
                                         </button>
                                         <div className="flex gap-2 mr-4 border-r border-pidgey-border pr-4">
                                             <button onClick={copyBorderStyle} className="text-pidgey-muted hover:text-white" title="Copy Border Style"><Copy size={16}/></button>
                                             <button onClick={pasteBorderStyle} className="text-pidgey-muted hover:text-white" title="Paste Border Style"><Download size={16}/></button>
                                         </div>
                                     </>
                                 )}

                                 {/* ACTIONS: Save Direct or Send to Pidgey */}
                                 {selectedStamp?.id !== 'new' && (
                                     <button 
                                        onClick={handleSaveDirectly}
                                        disabled={isProcessing || !previewUrl}
                                        className="px-3 py-2 bg-pidgey-dark border border-pidgey-border text-pidgey-muted hover:text-white font-bold rounded-lg transition text-xs flex items-center gap-1 disabled:opacity-50"
                                     >
                                        <Save size={14} /> Quick Save
                                     </button>
                                 )}

                                 <button 
                                    onClick={handleSendToPidgey}
                                    disabled={isProcessing || !previewUrl}
                                    className="px-6 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition flex items-center gap-2 shadow-lg hover:shadow-teal-400/20 disabled:opacity-50"
                                    title="Send as Draft to Pidgey Creations for approval"
                                 >
                                    <Bird size={18} /> 
                                    {selectedStamp?.id === 'new' ? 'Send to Pidgey' : 'Propose as Draft'}
                                </button>
                             </div>
                        </div>

                        {/* Canvas Area */}
                        <div className={`flex-1 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] relative flex items-center justify-center overflow-hidden p-8 ${mode === 'stamps' ? 'bg-pidgey-dark' : 'bg-slate-900'}`}>
                            
                            {/* THE COMPOSITION LAYER */}
                            <div className={`relative transition-all duration-300 shadow-2xl ${
                                mode === 'stamps' 
                                ? `w-[300px] h-[400px] ${getEffectClass()}` // Stamp Ratio 3:4
                                : `w-[800px] h-[450px]` // Template Ratio 16:9 (Scaled for UI)
                            }`}>
                                {/* 1. Base Art Layer with Advanced Border */}
                                <div 
                                    style={mode === 'stamps' && borderConfig.enabled ? getMaterialStyle(borderConfig, CANVAS_BG_COLOR) : { borderRadius: '12px', overflow: 'hidden' }}
                                    className={`absolute inset-0 transition-all duration-300 ${mode === 'stamps' ? '' : 'rounded-lg shadow-md bg-white'} ${effectConfig.type === 'shimmer' ? 'fx-shimmer' : ''}`}
                                >
                                    <div className="w-full h-full overflow-hidden flex items-center justify-center relative" style={{ 
                                        borderRadius: mode === 'stamps' && borderConfig.enabled ? `${Math.max(2, borderConfig.radius - borderConfig.thickness)}px` : 'inherit',
                                        backgroundColor: mode === 'stamps' ? '#1e293b' : 'white', // Inner background for the art
                                        // Apply inner border for frames
                                        border: mode === 'stamps' && borderConfig.enabled && borderConfig.innerThickness > 0 ? `${borderConfig.innerThickness}px solid ${borderConfig.innerColor}` : 'none',
                                        boxSizing: 'border-box'
                                    }}>
                                        {previewUrl ? (
                                            <img 
                                                src={previewUrl} 
                                                className="w-full h-full object-cover" 
                                                style={{
                                                    transform: `scale(${artConfig.scale}) translate(${artConfig.x}px, ${artConfig.y}px)`,
                                                    transition: 'transform 0.1s ease-out'
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-500 opacity-50">
                                                <ImageIcon size={48} className="mb-2" />
                                                <span className="text-[10px] font-bold uppercase">No Image</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Effects Layer (Overlay) - Respects Container Radius */}
                                {effectConfig.type === 'foil' && (
                                    <div className="fx-foil pointer-events-none absolute inset-0 rounded-[inherit] z-20" style={{ opacity: effectConfig.intensity / 100 }} />
                                )}
                                {effectConfig.type === 'holo_foil' && (
                                    <div className="fx-holo-foil pointer-events-none absolute inset-0 rounded-[inherit] z-20" style={{ opacity: effectConfig.intensity / 100 }} />
                                )}
                                {effectConfig.type === 'sparkles' && (
                                    <div className="fx-sparkles pointer-events-none absolute inset-0 rounded-[inherit] z-20" style={{ opacity: effectConfig.intensity / 100 }} />
                                )}

                                {/* 3. Text Layer */}
                                {showTextOverlay && (
                                    <div 
                                        className={`absolute pointer-events-none z-30`}
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
                            <Type size={16} /> Text
                        </button>
                        <button onClick={() => setActiveTab('fx')} className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${activeTab === 'fx' ? 'text-pidgey-accent border-b-2 border-pidgey-accent bg-pidgey-panel' : 'text-pidgey-muted hover:text-white'}`}>
                            <Sparkles size={16} /> FX & Style
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
                                    <div onClick={() => fileInputRef.current?.click()} className="h-20 border border-dashed border-pidgey-border rounded-lg flex flex-col items-center justify-center text-pidgey-muted hover:border-pidgey-accent hover:text-white cursor-pointer hover:bg-pidgey-dark transition">
                                        <Upload size={20} className="mb-1" />
                                        <span className="text-[9px] font-bold uppercase">Click to Browse</span>
                                    </div>
                                </div>

                                <div className="h-px bg-pidgey-border" />
                                
                                <ArtControls config={artConfig} onChange={setArtConfig} />

                                {mode === 'stamps' && (
                                    <>
                                        <div className="h-px bg-pidgey-border" />
                                        <BorderEditor config={borderConfig} onChange={setBorderConfig} />
                                    </>
                                )}

                                <div className="h-px bg-pidgey-border" />

                                {/* Gen AI Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Wand2 size={14} className="text-pidgey-secondary"/> AI Asset Gen</h3>
                                    
                                    <div className="mb-3">
                                        <label className="text-[10px] font-bold text-pidgey-muted uppercase mb-1 block">Style Preset</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {STYLE_PRESETS.map(style => (
                                                <button 
                                                    key={style.id}
                                                    onClick={() => setSelectedStyle(style)}
                                                    className={`px-2 py-1.5 rounded text-[10px] font-bold border transition truncate ${selectedStyle.id === style.id ? 'bg-pidgey-secondary text-white border-pidgey-secondary' : 'bg-pidgey-dark text-pidgey-muted border-pidgey-border hover:border-pidgey-muted'}`}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <textarea 
                                            value={prompt}
                                            onChange={e => setPrompt(e.target.value)}
                                            className="w-full h-20 bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-xs focus:border-pidgey-secondary outline-none resize-none text-white"
                                            placeholder="Describe your vision..."
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3">
                                        <input 
                                            type="checkbox" 
                                            id="animate" 
                                            checked={isAnimating} 
                                            onChange={e => setIsAnimating(e.target.checked)} 
                                            className="rounded border-pidgey-border bg-pidgey-panel text-pidgey-secondary focus:ring-pidgey-secondary"
                                        />
                                        <label htmlFor="animate" className="text-[10px] font-bold text-pidgey-muted cursor-pointer flex items-center gap-1">
                                            <Film size={10} /> Generate as GIF / Motion
                                        </label>
                                    </div>

                                    <button 
                                        onClick={handleGenerateAI}
                                        disabled={isProcessing || !prompt}
                                        className="w-full py-2 bg-gradient-to-r from-pidgey-secondary to-purple-600 text-white font-bold rounded-lg hover:brightness-110 transition flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Sparkles size={14} /> Generate
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB: TYPOGRAPHY */}
                        {activeTab === 'text' && (
                            <TextEditor 
                                config={textConfig} 
                                onChange={setTextConfig} 
                                showOverlay={showTextOverlay} 
                                onToggleOverlay={setShowTextOverlay} 
                            />
                        )}

                        {/* TAB: FX & GIF */}
                        {activeTab === 'fx' && (
                            <EffectsEditor config={effectConfig} onChange={setEffectConfig} />
                        )}

                    </div>
                </div>
            ) : (
                <div className="w-80 bg-pidgey-dark/30 border border-dashed border-pidgey-border rounded-xl flex items-center justify-center text-pidgey-muted p-6 text-center">
                    <p className="text-xs">Select an item to open Inspector</p>
                </div>
            )}

            {/* Load Asset Modal */}
            {isLoadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-xl w-full max-w-4xl shadow-2xl p-6 h-[70vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4 border-b border-pidgey-border pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FolderOpen size={20} className="text-pidgey-accent" /> Load Asset for Editing
                            </h2>
                            <button onClick={() => setIsLoadModalOpen(false)} className="text-pidgey-muted hover:text-white"><X size={20}/></button>
                        </div>
                        
                        {/* Tab Switcher */}
                        <div className="flex gap-4 mb-4">
                            <button 
                                onClick={() => setLoadTab('database')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 ${loadTab === 'database' ? 'bg-pidgey-accent text-pidgey-dark' : 'bg-pidgey-dark text-pidgey-muted border border-pidgey-border'}`}
                            >
                                <Database size={14} /> Database Stamps
                            </button>
                            <button 
                                onClick={() => setLoadTab('storage')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 ${loadTab === 'storage' ? 'bg-pidgey-accent text-pidgey-dark' : 'bg-pidgey-dark text-pidgey-muted border border-pidgey-border'}`}
                            >
                                <HardDrive size={14} /> File Storage
                            </button>
                        </div>

                        {loadTab === 'database' ? (
                            <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pr-2">
                                {stamps.map(stamp => (
                                    <div 
                                        key={stamp.id} 
                                        onClick={() => {
                                            handleSelectStamp(stamp);
                                            setIsLoadModalOpen(false);
                                        }}
                                        className="bg-pidgey-dark border border-pidgey-border rounded-xl p-3 cursor-pointer hover:border-pidgey-accent hover:-translate-y-1 transition-all group"
                                    >
                                        <div className="aspect-[3/4] bg-pidgey-panel rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                                            {stamp.art_path ? <img src={stamp.art_path} className="w-full h-full object-contain p-2" /> : <ImageIcon size={24} className="opacity-20"/>}
                                        </div>
                                        <div className="font-bold text-xs truncate text-white">{stamp.name}</div>
                                        <div className="text-[10px] text-pidgey-muted uppercase mt-1">{stamp.status}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto">
                                {loadingFiles ? (
                                    <div className="flex items-center justify-center h-full text-pidgey-muted gap-2">
                                        <Loader className="animate-spin" size={20} /> Loading storage...
                                    </div>
                                ) : storageFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-pidgey-muted">
                                        <HardDrive size={40} className="mb-2 opacity-20" />
                                        <p className="text-sm">No files found in 'stamps' bucket.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pr-2">
                                        {storageFiles.map(file => (
                                            <div 
                                                key={file.id} 
                                                onClick={() => {
                                                    handleSelectRawFile(file);
                                                    setIsLoadModalOpen(false);
                                                }}
                                                className="bg-pidgey-dark border border-pidgey-border rounded-xl p-3 cursor-pointer hover:border-pidgey-accent hover:-translate-y-1 transition-all group"
                                            >
                                                <div className="aspect-[3/4] bg-pidgey-panel rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                                                    <img src={file.url} className="w-full h-full object-contain p-2" />
                                                </div>
                                                <div className="font-bold text-xs truncate text-white">{file.name}</div>
                                                <div className="text-[10px] text-pidgey-muted uppercase mt-1 flex justify-between">
                                                    <span>RAW FILE</span>
                                                    <span>{(file.size_kb/1024).toFixed(1)} MB</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
