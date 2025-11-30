
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bird, Sparkles, RefreshCw, CheckCircle2, ArrowRight, ExternalLink, Plus, Egg, Megaphone, StickyNote, User, Palette } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPidgeyDailyBrief, chatWithPidgey, generateImageAsset, generateStampName } from '../services/geminiService';
import { ChatMessage, CreationDraft } from '../types';
import { useJarvis } from '../JarvisContext';
import { PUBLIC_SCHEMA_DDL } from '../schema';
import { AdminService } from '../services/adminService';
import { supabase } from '../services/supabaseClient';

export const JarvisAgent: React.FC = () => {
    const { isOpen, closePidgey, initialMessage, clearMessage, mood, setMood, memories, learn, addCreation } = useJarvis();
    const [activeTab, setActiveTab] = useState<'today' | 'chat'>('today');
    const [brief, setBrief] = useState<string>('');
    const [isLoadingBrief, setIsLoadingBrief] = useState(false);
    
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: "Peep peep! 🐦 I'm ready to help! What's the plan, Boss?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Draft Menu State
    const [showDraftMenu, setShowDraftMenu] = useState(false);

    // Construct Context for AI using REAL Data
    const getSystemContext = async () => {
        const realData = await AdminService.pidgey.getRealContext();
        
        // Fetch Stamp Inventory (Ready/Draft stamps) for Drop Creation logic
        const { data: inventory } = await supabase.from('stamps').select('*').in('status', ['ready', 'draft']);

        return {
            schema: PUBLIC_SCHEMA_DDL,
            currentPage: location.pathname,
            ...realData, // tickets, activeDrops, operational stats, promos, broadcasts
            inventory: inventory || [],
            memories: memories // Pass learned facts
        };
    };

    useEffect(() => {
        if (isOpen && activeTab === 'today' && !brief) {
            loadBrief();
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    useEffect(() => {
        if (isOpen && initialMessage) {
            setActiveTab('chat');
            handleSendMessage(initialMessage);
            clearMessage();
        }
    }, [isOpen, initialMessage]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadBrief = async () => {
        setIsLoadingBrief(true);
        setMood('thinking');
        const context = await getSystemContext();
        const text = await getPidgeyDailyBrief(context);
        setBrief(text);
        setMood('happy');
        setIsLoadingBrief(false);
    };

    const handleSendMessage = async (msgText: string = input) => {
        if (!msgText.trim()) return;

        if (msgText === input) setInput('');
        setShowDraftMenu(false); // Close menu if open

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: msgText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setMood('thinking');

        const context = await getSystemContext();
        let responseText = await chatWithPidgey(msgText, context);

        // 1. Parse Memories
        const learnRegex = /\[\[LEARNED:\s*(.*?)\]\]/g;
        let match;
        while ((match = learnRegex.exec(responseText)) !== null) {
            const fact = match[1];
            learn(fact);
            console.log("Pidgey learned:", fact);
        }
        responseText = responseText.replace(learnRegex, '').trim();

        // 2. Parse Actions (Listener Implementation)
        const actionRegex = /\$\$ACTION:SAVE_DRAFT:(.*?)\$\$/;
        const actionMatch = responseText.match(actionRegex);
        
        let createdDraft: CreationDraft | null = null;

        if (actionMatch) {
            try {
                const rawPayload = JSON.parse(actionMatch[1]);
                
                // --- VISUAL ASSET GENERATION & NAMING FOR STAMPS ---
                // If Pidgey drafted a stamp but didn't provide a real URL, generate one now.
                if (rawPayload.type === 'stamp') {
                    
                    // 1. Auto-Name using Pidgey's specialized naming logic
                    // If the name is generic or missing, give it a creative boost
                    try {
                        const creativeName = await generateStampName({
                            rarity: rawPayload.data.rarity || 'common',
                            material: rawPayload.data.design_config?.border?.material || 'none',
                            style: rawPayload.data.design_config?.border?.style || 'perforated',
                            visualPrompt: rawPayload.data.name || rawPayload.data.description || "A stamp"
                        });
                        
                        // Use the generated name
                        if (creativeName) {
                            rawPayload.data.name = creativeName;
                            // Update summary to reflect new name
                            rawPayload.summary = `New Stamp: ${creativeName}`; 
                        }
                    } catch (e) {
                        console.error("Auto-naming failed:", e);
                    }

                    // 2. Art Generation
                    const hasValidArt = rawPayload.data.art_path && rawPayload.data.art_path.startsWith('http');
                    
                    if (!hasValidArt) {
                        setMessages(prev => [...prev, {
                            id: Date.now().toString() + '_art',
                            role: 'assistant',
                            content: `*One moment, painting the art for "${rawPayload.data.name}"...* 🎨`,
                            timestamp: new Date()
                        }]);

                        // Enforce "Full Bleed" style
                        const visualPrompt = `Full bleed stamp art for "${rawPayload.data.name}", ${rawPayload.data.rarity || 'common'} rarity, highly detailed, filling the entire frame, vector style, no borders`;
                        
                        try {
                            const base64Art = await generateImageAsset(visualPrompt);
                            if (base64Art) {
                                // Upload to public_stamps folder
                                const { data: uploadData, error: uploadError } = await AdminService.files.uploadBase64(base64Art, 'stamps', 'public_stamps');
                                if (uploadData && uploadData.url) {
                                    rawPayload.data.art_path = uploadData.url;
                                } else {
                                    console.error("Art upload failed:", uploadError);
                                    rawPayload.data.art_path = 'https://picsum.photos/seed/pidgey_upload_fail/300/400';
                                }
                            } else {
                                rawPayload.data.art_path = 'https://picsum.photos/seed/pidgey_gen_fail/300/400';
                            }
                        } catch (e) {
                            console.error("Art generation failed:", e);
                            rawPayload.data.art_path = 'https://picsum.photos/seed/pidgey_error/300/400';
                        }
                    }
                }
                // ------------------------------------------

                // Create draft object
                createdDraft = {
                    id: `draft_${Date.now()}`,
                    type: rawPayload.type,
                    data: rawPayload.data,
                    summary: rawPayload.summary || `New ${rawPayload.type}`,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };

                // Add to Centralized Repository
                addCreation(createdDraft);

                responseText = responseText.replace(actionRegex, '').trim();
            } catch (e) {
                console.error("Failed to parse action", e);
            }
        }

        // 3. Parse Navigation
        const navRegex = /\$\$NAVIGATE:(.*?)\$\$/;
        const navMatch = responseText.match(navRegex);
        if (navMatch) {
            const path = navMatch[1];
            navigate(path);
            responseText = responseText.replace(navRegex, '').trim();
             setMessages(prev => [...prev, {
                id: Date.now().toString() + '_nav',
                role: 'assistant',
                content: `*Flapping wings... navigating to ${path}!* 🚁`,
                timestamp: new Date()
             }]);
        }

        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
            action: createdDraft
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
        setMood('idle');
    };

    const handleViewCreations = () => {
        navigate('/creations');
        closePidgey();
    };

    const handleQuickAction = (action: string) => {
        // Trigger generic Pidgey requests via buttons
        handleSendMessage(action);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-pidgey-dark border-l border-pidgey-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out font-sans">
            {/* Header */}
            <div className="p-4 border-b border-pidgey-border flex items-center justify-between bg-pidgey-panel/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                        mood === 'thinking' ? 'bg-purple-500/20 text-purple-400 animate-pulse' : 
                        mood === 'happy' ? 'bg-pidgey-accent text-pidgey-dark' : 
                        'bg-pidgey-accent/20 text-pidgey-accent'
                    }`}>
                        <Bird size={24} className={mood === 'happy' ? 'animate-bounce' : ''} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-none">Pidgey</h3>
                        <span className="text-[11px] text-pidgey-muted font-medium">Ops Copilot v4.0 (Dreamy)</span>
                    </div>
                </div>
                <button onClick={closePidgey} className="p-2 hover:bg-white/5 rounded-full text-pidgey-muted hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex p-2 gap-2 border-b border-pidgey-border bg-pidgey-dark">
                <button 
                    onClick={() => setActiveTab('today')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'today' 
                            ? 'bg-pidgey-panel text-white shadow-sm ring-1 ring-pidgey-border' 
                            : 'text-pidgey-muted hover:text-white hover:bg-pidgey-panel/50'
                    }`}
                >
                    <CheckCircle2 size={16} /> Briefing
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'chat' 
                            ? 'bg-pidgey-panel text-white shadow-sm ring-1 ring-pidgey-border' 
                            : 'text-pidgey-muted hover:text-white hover:bg-pidgey-panel/50'
                    }`}
                >
                    <Sparkles size={16} /> Chat
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-pidgey-dark scrollbar-thin">
                {activeTab === 'today' ? (
                    <div className="p-6">
                        {isLoadingBrief ? (
                             <div className="flex flex-col items-center justify-center h-64 text-pidgey-muted text-center space-y-4">
                                <Bird size={48} className="text-pidgey-accent/50 animate-bounce" />
                                <p className="text-sm">Flying around checking the nests...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <div dangerouslySetInnerHTML={{ 
                                        __html: brief
                                            .replace(/\n/g, '<br/>')
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-pidgey-accent">$1</strong>')
                                            .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white mb-2">$1</h1>')
                                            .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-4 mb-2 border-b border-pidgey-border pb-1">$1</h2>')
                                            .replace(/^- (.*$)/gim, '<li class="flex gap-2 items-start text-pidgey-text/90 my-2"><span class="text-pidgey-accent mt-1">•</span><span>$1</span></li>')
                                            .replace(/^\d\.\s(.*$)/gim, '<div class="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 my-3 shadow-sm"><div class="font-medium">$1</div></div>')
                                    }} />
                                </div>
                                <button 
                                    onClick={loadBrief} 
                                    className="w-full py-3 mt-4 border border-dashed border-pidgey-border rounded-xl text-xs text-pidgey-muted hover:text-pidgey-accent hover:border-pidgey-accent transition flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} /> Refresh Brief
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 p-4 space-y-4">
                            {/* Quick Actions Chips (Empty State) */}
                            {messages.length === 1 && (
                                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                                    <p className="w-full text-center text-xs text-pidgey-muted mb-2">Start with a draft:</p>
                                    <button onClick={() => handleQuickAction("Draft a new stamp")} className="px-3 py-1.5 bg-pidgey-panel hover:bg-pidgey-accent/20 border border-pidgey-border hover:border-pidgey-accent rounded-full text-xs font-medium transition-colors text-pidgey-muted hover:text-white flex items-center gap-1">
                                        <Palette size={12}/> Stamp
                                    </button>
                                    <button onClick={() => handleQuickAction("Create a new drop")} className="px-3 py-1.5 bg-pidgey-panel hover:bg-pidgey-accent/20 border border-pidgey-border hover:border-pidgey-accent rounded-full text-xs font-medium transition-colors text-pidgey-muted hover:text-white flex items-center gap-1">
                                        <Egg size={12}/> Drop
                                    </button>
                                    <button onClick={() => handleQuickAction("Draft a broadcast")} className="px-3 py-1.5 bg-pidgey-panel hover:bg-pidgey-accent/20 border border-pidgey-border hover:border-pidgey-accent rounded-full text-xs font-medium transition-colors text-pidgey-muted hover:text-white flex items-center gap-1">
                                        <Megaphone size={12}/> Broadcast
                                    </button>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-pidgey-accent/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                                                <Bird size={16} className="text-pidgey-accent" />
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-pidgey-accent text-pidgey-dark font-medium rounded-tr-sm' 
                                                : 'bg-pidgey-panel border border-pidgey-border text-pidgey-text rounded-tl-sm'
                                        }`}>
                                            <div dangerouslySetInnerHTML={{ 
                                                __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                                            }} />
                                        </div>
                                    </div>
                                    
                                    {/* Creation Card (Listener Result) */}
                                    {msg.action && (
                                        <div className="mt-2 ml-10 max-w-[85%] bg-gradient-to-br from-pidgey-panel to-pidgey-dark border border-pidgey-accent/50 rounded-xl p-4 shadow-lg animate-in slide-in-from-left-4 fade-in duration-500">
                                            <div className="flex items-center gap-2 mb-2 text-pidgey-accent font-bold uppercase text-xs tracking-wider">
                                                <Sparkles size={14} /> Draft Saved
                                            </div>
                                            <div className="flex items-start gap-3">
                                                {msg.action.type === 'stamp' && msg.action.data.art_path && (
                                                    <div className="w-16 h-20 bg-black/20 rounded-md overflow-hidden flex-shrink-0 border border-pidgey-border">
                                                        <img src={msg.action.data.art_path} className="w-full h-full object-cover" alt="Preview" />
                                                    </div>
                                                )}
                                                {/* Drop Banner Preview */}
                                                {msg.action.type === 'drop' && msg.action.data.banner_path && (
                                                    <div className="w-20 h-12 bg-black/20 rounded-md overflow-hidden flex-shrink-0 border border-pidgey-border">
                                                        <img src={msg.action.data.banner_path} className="w-full h-full object-cover" alt="Banner" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold mb-1 text-white capitalize">
                                                        {msg.action.summary}
                                                    </p>
                                                    <p className="text-xs text-pidgey-muted mb-3">
                                                        I've sent this to your Creations Tab for final approval.
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleViewCreations}
                                                className="w-full py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition flex items-center justify-center gap-2 text-sm"
                                            >
                                                Go to Creations Tab <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-pidgey-accent/20 flex items-center justify-center">
                                        <Bird size={16} className="text-pidgey-accent animate-pulse" />
                                    </div>
                                    <div className="bg-pidgey-panel border border-pidgey-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-pidgey-muted rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-pidgey-muted rounded-full animate-bounce delay-100"></span>
                                        <span className="w-1.5 h-1.5 bg-pidgey-muted rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        {/* Input Area */}
                        <div className="p-4 bg-pidgey-panel border-t border-pidgey-border relative">
                            {/* Draft Menu Popover */}
                            {showDraftMenu && (
                                <div className="absolute bottom-full left-4 mb-2 bg-pidgey-dark border border-pidgey-border rounded-xl shadow-2xl p-2 w-64 animate-in slide-in-from-bottom-2 fade-in z-20">
                                    <div className="text-[10px] uppercase font-bold text-pidgey-muted px-2 py-1 mb-1">Create New Draft</div>
                                    <div className="grid grid-cols-1 gap-1">
                                        <button 
                                            onClick={() => handleQuickAction("Draft a new Stamp with a unique theme")} 
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-pidgey-panel rounded-lg text-left transition-colors group"
                                        >
                                            <div className="w-6 h-6 rounded bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors"><Palette size={14}/></div>
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white">Stamp</span>
                                        </button>
                                        <button 
                                            onClick={() => handleQuickAction("Create a new drop")} 
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-pidgey-panel rounded-lg text-left transition-colors group"
                                        >
                                            <div className="w-6 h-6 rounded bg-yellow-500/10 text-yellow-400 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors"><Egg size={14}/></div>
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white">Drop</span>
                                        </button>
                                        <button 
                                            onClick={() => handleQuickAction("Draft a Broadcast message")} 
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-pidgey-panel rounded-lg text-left transition-colors group"
                                        >
                                            <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors"><Megaphone size={14}/></div>
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white">Broadcast</span>
                                        </button>
                                        <button 
                                            onClick={() => handleQuickAction("Draft a Promo code")} 
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-pidgey-panel rounded-lg text-left transition-colors group"
                                        >
                                            <div className="w-6 h-6 rounded bg-green-500/10 text-green-400 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors"><StickyNote size={14}/></div>
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white">Promo</span>
                                        </button>
                                        <button 
                                            onClick={() => handleQuickAction("Draft a new Member profile")} 
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-pidgey-panel rounded-lg text-left transition-colors group"
                                        >
                                            <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors"><User size={14}/></div>
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white">Member</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="relative flex gap-2">
                                <button 
                                    onClick={() => setShowDraftMenu(!showDraftMenu)}
                                    className={`p-3 rounded-xl transition-colors flex-shrink-0 ${showDraftMenu ? 'bg-pidgey-accent text-pidgey-dark rotate-45' : 'bg-pidgey-dark border border-pidgey-border text-pidgey-muted hover:text-white hover:border-pidgey-accent'}`}
                                >
                                    <Plus size={20} className="transition-transform duration-300" />
                                </button>
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Ask Pidgey to create a drop, broadcast, or promo..."
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-pidgey-accent focus:ring-1 focus:ring-pidgey-accent text-white placeholder-pidgey-muted transition-all"
                                    />
                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={!input.trim() || isTyping}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-pidgey-accent text-pidgey-dark rounded-lg hover:bg-teal-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
