
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bird, Sparkles, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPidgeyDailyBrief, chatWithPidgey } from '../services/geminiService';
import { ChatMessage } from '../types';
import { MOCK_DROPS, MOCK_OPERATIONAL_STATS, MOCK_TICKETS, MOCK_PROFILES } from '../constants';
import { useJarvis } from '../JarvisContext';
import { PUBLIC_SCHEMA_DDL } from '../schema';
import { supabase } from '../services/supabaseClient';

export const JarvisAgent: React.FC = () => {
    const { isOpen, closePidgey, initialMessage, clearMessage, mood, setMood, setDraftPayload, memories, learn } = useJarvis();
    const [activeTab, setActiveTab] = useState<'today' | 'chat'>('today');
    const [brief, setBrief] = useState<string>('');
    const [isLoadingBrief, setIsLoadingBrief] = useState(false);
    
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: "Peep! I'm Pidgey. How's the nest looking today?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Construct Context for AI
    const getSystemContext = async () => {
        let userCount = MOCK_PROFILES.length;
        let recentProfiles = [];
        
        const { count, data: profiles } = await supabase.from('profiles').select('*', { count: 'exact' }).limit(5);
        if (count !== null) userCount = count;
        if (profiles) recentProfiles = profiles;

        return {
            schema: PUBLIC_SCHEMA_DDL,
            currentPage: location.pathname,
            tickets: MOCK_TICKETS.map(t => ({ id: t.id, subject: t.subject, priority: t.priority, status: t.status })),
            activeDrops: MOCK_DROPS.filter(d => d.status === 'live').map(d => d.title),
            operational: MOCK_OPERATIONAL_STATS,
            userCount: userCount,
            recentProfiles: recentProfiles.map(p => ({ id: p.id, role: p.role, tier: p.tier })),
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

        // 2. Parse Actions
        const actionRegex = /\$\$ACTION:(.*?):(.*?)\$\$/;
        const actionMatch = responseText.match(actionRegex);
        
        let actionData = null;
        if (actionMatch) {
            try {
                const actionType = actionMatch[1] as any;
                const actionPayload = JSON.parse(actionMatch[2]);
                actionData = { type: actionType, payload: actionPayload };
                responseText = responseText.replace(actionRegex, '').trim();
            } catch (e) {
                console.error("Failed to parse action", e);
            }
        }

        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
            action: actionData
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
        setMood('idle');
    };

    const handleReviewAction = (action: any) => {
        if (action.type === 'DRAFT_DROP' || action.type === 'DRAFT_STAMP') {
            setDraftPayload({ type: action.type, data: action.payload });
            navigate('/drops');
            closePidgey();
        } else if (action.type === 'DRAFT_PROMO') {
            setDraftPayload({ type: action.type, data: action.payload });
            navigate('/promos');
            closePidgey();
        }
    };

    const getActionTitle = (action: any) => {
        switch(action.type) {
            case 'DRAFT_DROP': return `Drop: ${action.payload.title}`;
            case 'DRAFT_STAMP': return `Stamp: ${action.payload.name}`;
            case 'DRAFT_PROMO': return `Promo: ${action.payload.code}`;
            default: return 'Draft Item';
        }
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
                        <span className="text-[11px] text-pidgey-muted font-medium">Ops Copilot</span>
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
                    <CheckCircle2 size={16} /> Today
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'chat' 
                            ? 'bg-pidgey-panel text-white shadow-sm ring-1 ring-pidgey-border' 
                            : 'text-pidgey-muted hover:text-white hover:bg-pidgey-panel/50'
                    }`}
                >
                    <Sparkles size={16} /> Ask Pidgey
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
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-pidgey-accent/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                                                <Bird size={16} className="text-pidgey-accent" />
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-pidgey-accent text-pidgey-dark font-medium rounded-tr-sm' 
                                                : 'bg-pidgey-panel border border-pidgey-border text-pidgey-text rounded-tl-sm'
                                        }`}>
                                            <div dangerouslySetInnerHTML={{ 
                                                __html: msg.content.replace(/\n/g, '<br/>') 
                                            }} />
                                        </div>
                                    </div>
                                    
                                    {/* Action Card */}
                                    {msg.action && (
                                        <div className="mt-2 ml-10 max-w-[85%] bg-pidgey-panel border border-pidgey-accent/50 rounded-xl p-4 shadow-lg animate-in slide-in-from-left-4 fade-in duration-500">
                                            <div className="flex items-center gap-2 mb-2 text-pidgey-accent font-bold uppercase text-xs tracking-wider">
                                                <Sparkles size={14} /> Draft Created
                                            </div>
                                            <p className="text-sm font-bold mb-1">
                                                {getActionTitle(msg.action)}
                                            </p>
                                            <p className="text-xs text-pidgey-muted mb-3">
                                                Ready for your review. I've pre-filled the details.
                                            </p>
                                            <button 
                                                onClick={() => handleReviewAction(msg.action)}
                                                className="w-full py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition flex items-center justify-center gap-2 text-sm"
                                            >
                                                Review Now <ArrowRight size={16} />
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
                        <div className="p-4 bg-pidgey-panel border-t border-pidgey-border">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask Pidgey..."
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
                )}
            </div>
        </div>
    );
};
