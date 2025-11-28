
import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Upload, Save, Loader, AlertTriangle, RefreshCw, Palette, LayoutTemplate, Plus, Type, Move, AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown, Square, RectangleHorizontal, RectangleVertical, Repeat, MailOpen } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { generateImageAsset } from '../services/geminiService';
import { Stamp, Asset } from '../types';

type StudioMode = 'stamps' | 'templates';
type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3';

interface TextConfig {
    text: string;
    font: 'font-sans' | 'font-serif' | 'font-mono' | 'font-handwriting';
    size: number;
    color: string;
    align: 'text-left' | 'text-center' | 'text-right';
    vertical: 'justify-start' | 'justify-center' | 'justify-end';
}

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
    const [activeTab, setActiveTab] = useState<'upload' | 'ai' | 'design'>('upload');
    const [previewUrl, setPreviewUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isFlipped, setIsFlipped] = useState(false); // 3D Flip State
    
    // Template Specific State
    const [templateName, setTemplateName] = useState('');
    // const [showTextOverlay, setShowTextOverlay] = useState(true); // Deprecated in favor of Back Side
    const [textConfig, setTextConfig] = useState<TextConfig>({
        text: "Dear Friend,\n\nHoping this card brings a smile to your face!\n\nBest,\nPidgey",
        font: 'font-handwriting',
        size: 24,
        color: '#1e293b',
        align: 'text-center',
        vertical: 'justify-center'
    });
    
    // AI Input
    const [prompt, setPrompt] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [mode]);

    const loadData = async () => {
        setLoading(true);
        if (mode === 'stamps') {
            const { data } = await AdminService.stamps.list();
            setStamps(data);
            setSelectedTemplate(null);
            setIsFlipped(false);
            if (activeTab === 'design') setActiveTab('upload');
        } else {
            const { data } = await AdminService.files.list('templates');
            setTemplates(data);
            setSelectedStamp(null);
        }
        setLoading(false);
    };

    // --- Selection Handlers ---

    const handleSelectStamp = (stamp: Stamp) => {
        setSelectedStamp(stamp);
        setSelectedTemplate(null);
        setPreviewUrl(stamp.art_path || '');
        setPrompt(`A ${stamp.rarity.toLowerCase()} stamp of a ${stamp.name}, isolated on white background, vector style`);
        setAspectRatio('1:1'); // Stamps default to square
        setIsFlipped(false);
        if (activeTab === 'design') setActiveTab('upload');
    };

    const handleSelectTemplate = (template: Asset) => {
        setSelectedTemplate(template);
        setSelectedStamp(null);
        setPreviewUrl(template.url || '');
        setTemplateName(template.name.split('.')[0]);
        setPrompt("A greeting card background, soft pastel colors, floral border, whitespace in center");
        setAspectRatio('3:4'); // Templates default to portrait
        setIsFlipped(false); // Start on front
        setActiveTab('design'); // Auto-switch to design mode for templates
    };

    const handleNewTemplate = () => {
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
        setPreviewUrl('');
        setTemplateName(`template_${Date.now()}`);
        setPrompt("A greeting card background...");
        setAspectRatio('3:4');
        setIsFlipped(false);
        setActiveTab('ai');
    };

    // --- Action Handlers ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        // Upload to the correct bucket based on mode
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
            // Pass aspect ratio to generator
            const base64 = await generateImageAsset(prompt, { aspectRatio });
            if (base64) {
                // Upload base64 to storage immediately
                const bucket = mode === 'stamps' ? 'stamps' : 'templates';
                const { data, error } = await AdminService.files.uploadBase64(base64, bucket);
                
                if (data) {
                    setPreviewUrl(data.url);
                } else {
                     setPreviewUrl(`data:image/png;base64,${base64}`);
                     console.error("Storage upload failed", error);
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
        if (!previewUrl && mode !== 'templates') return; // Templates can be blank if just text? No, usually need bg.
        setIsProcessing(true);

        if (mode === 'stamps') {
            if (!selectedStamp || !selectedStamp.id) return alert("No stamp selected");
            
            const { error } = await AdminService.stamps.update(selectedStamp.id, {
                art_path: previewUrl
            });

            if (error) {
                alert("Failed to save stamp: " + error.message);
            } else {
                setStamps(prev => prev.map(s => s.id === selectedStamp.id ? { ...s, art_path: previewUrl } : s));
                alert("Stamp updated successfully!");
            }
        } else {
            // Saving Template 
            console.log("Saving template config:", textConfig);
            await loadData();
            alert("Template saved to library!");
        }
        setIsProcessing(false);
    };

    const handleTestOpen = () => {
        // Simulate the "Cut & Flip" animation sequence
        setIsFlipped(false); // Reset to front
        setTimeout(() => setIsFlipped(true), 800); // Flip after "cut"
    };

    // Calculate dimensions based on aspect ratio
    const getPreviewDimensions = () => {
        const baseHeight = 360;
        switch(aspectRatio) {
            case '1:1': return { width: baseHeight, height: baseHeight, class: 'aspect-square' };
            case '16:9': return { width: baseHeight * (16/9), height: baseHeight, class: 'aspect-video' };
            case '9:16': return { width: baseHeight * (9/16), height: baseHeight, class: 'aspect-[9/16]' };
            case '4:3': return { width: baseHeight * (4/3), height: baseHeight, class: 'aspect-[4/3]' };
            case '3:4': return { width: baseHeight * (3/4), height: baseHeight, class: 'aspect-[3/4]' };
            default: return { width: baseHeight, height: baseHeight, class: 'aspect-square' };
        }
    };

    const dims = getPreviewDimensions();

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* Left Panel: List */}
            <div className="w-80 bg-pidgey-panel border border-pidgey-border rounded-xl flex flex-col overflow-hidden transition-all">
                {/* Mode Switcher */}
                <div className="flex border-b border-pidgey-border">
                    <button 
                        onClick={() => setMode('stamps')}
                        className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors ${
                            mode === 'stamps' 
                            ? 'bg-pidgey-dark text-pidgey-accent border-b-2 border-pidgey-accent' 
                            : 'text-pidgey-muted hover:text-white hover:bg-pidgey-dark/50'
                        }`}
                    >
                        <Palette size={16} /> Stamps
                    </button>
                    <button 
                        onClick={() => setMode('templates')}
                        className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors ${
                            mode === 'templates' 
                            ? 'bg-pidgey-dark text-pidgey-accent border-b-2 border-pidgey-accent' 
                            : 'text-pidgey-muted hover:text-white hover:bg-pidgey-dark/50'
                        }`}
                    >
                        <LayoutTemplate size={16} /> Templates
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-3 border-b border-pidgey-border bg-pidgey-dark flex justify-between items-center">
                    <span className="text-xs font-bold text-pidgey-muted uppercase">{mode} Library</span>
                    <div className="flex gap-2">
                        {mode === 'templates' && (
                            <button onClick={handleNewTemplate} className="p-1.5 bg-pidgey-accent text-pidgey-dark rounded hover:bg-teal-300 transition" title="New Template">
                                <Plus size={14} />
                            </button>
                        )}
                        <button 
                            onClick={loadData} 
                            disabled={loading}
                            className="p-1.5 hover:bg-white/10 rounded text-pidgey-muted hover:text-white transition flex items-center gap-1 bg-pidgey-panel border border-pidgey-border"
                            title="Sync / Refresh Library"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
                
                {/* List Items */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-pidgey-panel">
                    {loading ? (
                        <div className="text-center py-8 text-pidgey-muted"><Loader className="animate-spin mx-auto mb-2"/> Loading...</div>
                    ) : (
                        mode === 'stamps' ? (
                            stamps.map(stamp => (
                                <div 
                                    key={stamp.id} 
                                    onClick={() => handleSelectStamp(stamp)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                                        selectedStamp?.id === stamp.id 
                                        ? 'bg-pidgey-dark border-pidgey-accent ring-1 ring-pidgey-accent' 
                                        : 'bg-pidgey-dark/50 border-pidgey-border hover:border-pidgey-muted'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded bg-black/40 flex items-center justify-center overflow-hidden border ${
                                        !stamp.art_path ? 'border-dashed border-pidgey-muted' : 'border-transparent'
                                    }`}>
                                        {stamp.art_path ? (
                                            <img src={stamp.art_path} className="w-full h-full object-cover" />
                                        ) : (
                                            <AlertTriangle size={14} className="text-yellow-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{stamp.name}</h4>
                                        <p className="text-[10px] text-pidgey-muted uppercase">{stamp.rarity}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Template List
                            [
                                ...(selectedTemplate?.id === 'new' ? [selectedTemplate] : []),
                                ...templates
                            ].map(tpl => (
                                <div 
                                    key={tpl.id} 
                                    onClick={() => handleSelectTemplate(tpl)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                                        selectedTemplate?.id === tpl.id 
                                        ? 'bg-pidgey-dark border-pidgey-accent ring-1 ring-pidgey-accent' 
                                        : 'bg-pidgey-dark/50 border-pidgey-border hover:border-pidgey-muted'
                                    }`}
                                >
                                    <div className="w-12 h-8 rounded bg-black/40 flex items-center justify-center overflow-hidden border border-pidgey-border">
                                        {tpl.url ? <img src={tpl.url} className="w-full h-full object-cover" /> : <LayoutTemplate size={14} className="text-pidgey-muted"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{tpl.name}</h4>
                                        <p className="text-[10px] text-pidgey-muted uppercase">{Math.round(tpl.size_kb)} KB</p>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Center: The Studio */}
            <div className="flex-1 bg-pidgey-dark border border-pidgey-border rounded-xl flex flex-col overflow-hidden relative">
                {!selectedStamp && !selectedTemplate ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-pidgey-muted">
                        <Sparkles size={48} className="mb-4 opacity-20" />
                        <p>Select an item to enter the Creative Studio</p>
                    </div>
                ) : (
                    <div className="flex-1 flex gap-6 p-6">
                        {/* Artwork Preview Canvas with 3D Flip */}
                        <div className="flex-1 flex flex-col items-center justify-center bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] rounded-xl border border-pidgey-border relative overflow-hidden [perspective:1000px]">
                            
                            {/* Card Container (The flipper) */}
                            <div 
                                style={{ width: dims.width, height: dims.height }}
                                className={`relative shadow-2xl transition-transform duration-700 [transform-style:preserve-3d] ${
                                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                                }`}
                            >
                                {/* Front Face (Art) */}
                                <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-lg overflow-hidden border-4 border-white shadow-sm flex flex-col items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Card Front" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <ImageIcon size={48} className="mb-2 opacity-50" />
                                            <p className="text-xs uppercase font-bold text-slate-400">Front Art</p>
                                        </div>
                                    )}
                                    {isProcessing && !isFlipped && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-10">
                                            <Loader className="animate-spin mb-2" size={32} />
                                            <span className="text-xs font-bold uppercase">Generating...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Back Face (Message) */}
                                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#f8f5e6] rounded-lg overflow-hidden border-4 border-white shadow-sm p-6 flex flex-col text-slate-800">
                                    {/* Simulated Paper Texture */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')] pointer-events-none"></div>
                                    
                                    {/* Text Content */}
                                    {mode === 'templates' && (
                                        <div className={`flex-1 flex flex-col relative z-10 ${textConfig.vertical}`}>
                                            <h2 
                                                style={{ color: textConfig.color, fontSize: `${textConfig.size}px` }}
                                                className={`${textConfig.font} ${textConfig.align} font-bold leading-relaxed whitespace-pre-wrap`}
                                            >
                                                {textConfig.text}
                                            </h2>
                                        </div>
                                    )}
                                    {mode === 'stamps' && (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                            <div className="w-20 h-24 border-2 border-dashed border-slate-400 rounded"></div>
                                            <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Postcard Back</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Canvas Controls (Flip / Open) */}
                            {mode === 'templates' && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                                    <button 
                                        onClick={() => setIsFlipped(!isFlipped)}
                                        className="bg-pidgey-dark/90 backdrop-blur border border-pidgey-border rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-white hover:bg-pidgey-panel transition shadow-lg"
                                    >
                                        <Repeat size={14} /> Flip Card
                                    </button>
                                    <button 
                                        onClick={handleTestOpen}
                                        className="bg-pidgey-accent text-pidgey-dark border border-pidgey-accent rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold hover:bg-teal-300 transition shadow-lg"
                                    >
                                        <MailOpen size={14} /> Test Open
                                    </button>
                                </div>
                            )}

                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={handleSave}
                                    disabled={(!previewUrl && !isFlipped) || isProcessing}
                                    className="px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition flex items-center gap-2 disabled:opacity-50 shadow-lg"
                                >
                                    <Save size={16} /> Save {mode === 'stamps' ? 'Stamp' : 'Template'}
                                </button>
                            </div>
                        </div>

                        {/* Tools Panel */}
                        <div className="w-80 flex flex-col gap-6">
                            <div className="bg-pidgey-panel border border-pidgey-border rounded-xl p-4">
                                <h2 className="font-bold text-lg mb-1">
                                    {mode === 'stamps' ? selectedStamp?.name : (templateName || 'New Template')}
                                </h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-700 text-slate-300`}>
                                    {mode === 'stamps' ? selectedStamp?.rarity : 'Card Template'}
                                </span>
                            </div>

                            <div className="bg-pidgey-panel border border-pidgey-border rounded-xl flex-1 flex flex-col overflow-hidden">
                                <div className="flex border-b border-pidgey-border">
                                    <button 
                                        onClick={() => { setActiveTab('upload'); setIsFlipped(false); }}
                                        className={`flex-1 py-3 text-[10px] font-bold uppercase transition ${activeTab === 'upload' ? 'bg-pidgey-accent/10 text-pidgey-accent border-b-2 border-pidgey-accent' : 'text-pidgey-muted hover:text-white'}`}
                                    >
                                        Art (Front)
                                    </button>
                                    <button 
                                        onClick={() => { setActiveTab('ai'); setIsFlipped(false); }}
                                        className={`flex-1 py-3 text-[10px] font-bold uppercase transition ${activeTab === 'ai' ? 'bg-pidgey-accent/10 text-pidgey-accent border-b-2 border-pidgey-accent' : 'text-pidgey-muted hover:text-white'}`}
                                    >
                                        AI Gen
                                    </button>
                                    {mode === 'templates' && (
                                        <button 
                                            onClick={() => { setActiveTab('design'); setIsFlipped(true); }}
                                            className={`flex-1 py-3 text-[10px] font-bold uppercase transition ${activeTab === 'design' ? 'bg-pidgey-accent/10 text-pidgey-accent border-b-2 border-pidgey-accent' : 'text-pidgey-muted hover:text-white'}`}
                                        >
                                            Msg (Back)
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto">
                                    {/* Aspect Ratio Selector (Visible in AI and Design modes mostly) */}
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Aspect Ratio</label>
                                        <div className="flex gap-2 bg-pidgey-dark rounded-lg p-1 border border-pidgey-border justify-between">
                                            {[
                                                { id: '1:1', icon: Square, label: 'Sq' },
                                                { id: '3:4', icon: RectangleVertical, label: 'Port' },
                                                { id: '4:3', icon: RectangleHorizontal, label: 'Land' },
                                                { id: '9:16', icon: RectangleVertical, label: 'Tall' },
                                                { id: '16:9', icon: RectangleHorizontal, label: 'Wide' }
                                            ].map((r: any) => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => setAspectRatio(r.id)}
                                                    className={`p-1.5 rounded flex flex-col items-center gap-1 transition ${
                                                        aspectRatio === r.id 
                                                        ? 'bg-pidgey-panel text-white shadow-sm' 
                                                        : 'text-pidgey-muted hover:text-white'
                                                    }`}
                                                    title={r.id}
                                                >
                                                    <r.icon size={16} />
                                                    <span className="text-[9px] font-bold">{r.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {activeTab === 'upload' && (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                            />
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full h-32 border-2 border-dashed border-pidgey-border rounded-xl flex flex-col items-center justify-center text-pidgey-muted hover:border-pidgey-accent hover:text-pidgey-accent cursor-pointer transition-colors"
                                            >
                                                <Upload size={32} className="mb-2" />
                                                <span className="text-xs font-bold uppercase">Click to Browse</span>
                                            </div>
                                            <p className="text-xs text-pidgey-muted">Supports PNG, JPG. Max 5MB.</p>
                                        </div>
                                    )}

                                    {activeTab === 'ai' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Prompt</label>
                                                <textarea 
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    className="w-full h-32 bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-sm focus:border-pidgey-accent outline-none resize-none"
                                                    placeholder={mode === 'stamps' ? "Describe the stamp art..." : "Describe the card background..."}
                                                />
                                            </div>
                                            <button 
                                                onClick={handleGenerateAI}
                                                disabled={isProcessing || !prompt}
                                                className="w-full py-3 bg-pidgey-secondary text-white font-bold rounded-lg hover:bg-purple-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Sparkles size={18} /> Generate Art
                                            </button>
                                            <div className="bg-pidgey-dark p-3 rounded text-[10px] text-pidgey-muted border border-pidgey-border">
                                                Tip: {mode === 'stamps' ? 'Mention "isolated" or "sticker style".' : 'Mention "border", "background", or "pattern".'}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'design' && mode === 'templates' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4">
                                            <div>
                                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Back Side Message</label>
                                                <textarea 
                                                    value={textConfig.text}
                                                    onChange={(e) => setTextConfig({...textConfig, text: e.target.value})}
                                                    className="w-full h-32 bg-pidgey-dark border border-pidgey-border rounded-lg p-3 text-sm focus:border-pidgey-accent outline-none"
                                                    placeholder="Type your message here..."
                                                />
                                                <p className="text-[10px] text-pidgey-muted mt-1">This appears on the flip side.</p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Typography</label>
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <select 
                                                        value={textConfig.font}
                                                        onChange={(e) => setTextConfig({...textConfig, font: e.target.value as any})}
                                                        className="bg-pidgey-dark border border-pidgey-border rounded p-2 text-xs"
                                                    >
                                                        <option value="font-handwriting">Handwriting</option>
                                                        <option value="font-sans">Sans Serif</option>
                                                        <option value="font-serif">Serif</option>
                                                        <option value="font-mono">Monospace</option>
                                                    </select>
                                                    <div className="flex items-center gap-2 bg-pidgey-dark border border-pidgey-border rounded p-1">
                                                        <input 
                                                            type="color" 
                                                            value={textConfig.color}
                                                            onChange={(e) => setTextConfig({...textConfig, color: e.target.value})}
                                                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                                                        />
                                                        <span className="text-xs font-mono">{textConfig.color}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Type size={14} className="text-pidgey-muted" />
                                                    <input 
                                                        type="range" 
                                                        min="12" 
                                                        max="72" 
                                                        value={textConfig.size}
                                                        onChange={(e) => setTextConfig({...textConfig, size: parseInt(e.target.value)})}
                                                        className="flex-1 h-1.5 bg-pidgey-dark rounded-lg appearance-none cursor-pointer accent-pidgey-accent"
                                                    />
                                                    <span className="text-xs w-6 text-right">{textConfig.size}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Placement</label>
                                                <div className="flex flex-col gap-2">
                                                    {/* Horizontal */}
                                                    <div className="flex bg-pidgey-dark rounded border border-pidgey-border p-1">
                                                        <button 
                                                            onClick={() => setTextConfig({...textConfig, align: 'text-left'})}
                                                            className={`flex-1 p-1 rounded flex justify-center ${textConfig.align === 'text-left' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}
                                                        >
                                                            <AlignLeft size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setTextConfig({...textConfig, align: 'text-center'})}
                                                            className={`flex-1 p-1 rounded flex justify-center ${textConfig.align === 'text-center' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}
                                                        >
                                                            <AlignCenter size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setTextConfig({...textConfig, align: 'text-right'})}
                                                            className={`flex-1 p-1 rounded flex justify-center ${textConfig.align === 'text-right' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}
                                                        >
                                                            <AlignRight size={16} />
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Vertical */}
                                                    <div className="flex bg-pidgey-dark rounded border border-pidgey-border p-1">
                                                        <button 
                                                            onClick={() => setTextConfig({...textConfig, vertical: 'justify-start'})}
                                                            className={`flex-1 p-1 rounded flex justify-center ${textConfig.vertical === 'justify-start' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}
                                                        >
                                                            <ArrowUp size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setTextConfig({...textConfig, vertical: 'justify-center'})}
                                                            className={`flex-1 p-1 rounded flex justify-center ${textConfig.vertical === 'justify-center' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}
                                                        >
                                                            <Move size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setTextConfig({...textConfig, vertical: 'justify-end'})}
                                                            className={`flex-1 p-1 rounded flex justify-center ${textConfig.vertical === 'justify-end' ? 'bg-pidgey-panel text-white' : 'text-pidgey-muted'}`}
                                                        >
                                                            <ArrowDown size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
