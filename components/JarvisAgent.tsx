import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getJarvisDailyBrief, chatWithJarvis } from '../services/geminiService';
import { ChatMessage } from '../types';
import { MOCK_DROPS, MOCK_OPERATIONAL_STATS, MOCK_PROFILES, MOCK_TICKETS, MOCK_CARDS, MOCK_USER_TEMPLATES } from '../constants';
import { useJarvis } from '../JarvisContext';
import { PUBLIC_SCHEMA_DDL } from '../schema';
import { supabase } from '../services/supabaseClient';

export const JarvisAgent: React.FC = () => {
    const { isOpen, closeJarvis, initialMessage, clearMessage } = useJarvis();
    const [activeTab, setActiveTab] = useState<'brief' | 'chat'>('brief');
    const [brief, setBrief] = useState<string>('');
    const [isLoadingBrief, setIsLoadingBrief] = useState(false);
    
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: 'Hello Admin. Pidgey JARVIS online. How can I assist with operations today?', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Construct Context for AI
    const getSystemContext = async () => {
        // Fetch real data for Jarvis context
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
            recentCards: MOCK_CARDS.slice(0, 5),
            templates: MOCK_USER_TEMPLATES.slice(0, 5)
        };
    };

    useEffect(() => {
        if (isOpen && activeTab === 'brief' && !brief) {
            loadBrief();
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    // Handle Inline Helper Intents
    useEffect(() => {
        if (isOpen && initialMessage) {
            setActiveTab('chat');
            // Auto-send the inline helper message
            handleSendMessage(initialMessage);
            clearMessage();
        }
    }, [isOpen, initialMessage]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadBrief = async () => {
        setIsLoadingBrief(true);
        const context = await getSystemContext();
        const text = await getJarvisDailyBrief(context);
        setBrief(text);
        setIsLoadingBrief(false);
    };

    const handleSendMessage = async (msgText: string = input) => {
        if (!msgText.trim()) return;

        // If triggered via function, we don't clear input, we just use the arg
        // If triggered via UI, we clear input
        if (msgText === input) {
             setInput('');
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: msgText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        const context = await getSystemContext();
        const responseText = await chatWithJarvis(msgText, context);

        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-pidgey-dark border-l border-pidgey-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-4 border-b border-pidgey-border flex items-center justify-between bg-pidgey-panel">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-pidgey-accent to-blue-600 flex items-center justify-center">
                        <Bot className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-none">Pidgey JARVIS</h3>
                        <span className="text-[10px] text-pidgey-accent uppercase tracking-wider font-bold">Ops Copilot v1.0</span>
                    </div>
                </div>
                <button onClick={closeJarvis} className="text-pidgey-muted hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-pidgey-border">
                <button 
                    onClick={() => setActiveTab('brief')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === 'brief' ? 'text-white' : 'text-pidgey-muted hover:text-white'
                    }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <BarChart3 size={16} /> Daily Brief
                    </span>
                    {activeTab === 'brief' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pidgey-accent"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === 'chat' ? 'text-white' : 'text-pidgey-muted hover:text-white'
                    }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <Sparkles size={16} /> Chat
                    </span>
                    {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pidgey-accent"></div>}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-pidgey-dark scrollbar-thin">
                {activeTab === 'brief' ? (
                    <div className="p-6 space-y-6">
                        {isLoadingBrief ? (
                             <div className="flex flex-col items-center justify-center h-64 text-pidgey-muted animate-pulse">
                                <Bot size={48} className="mb-4 text-pidgey-border" />
                                <p>Analyzing system telemetry...</p>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs text-pidgey-muted uppercase tracking-wider">{new Date().toLocaleDateString()}</span>
                                    <button onClick={loadBrief} className="text-xs text-pidgey-accent hover:underline flex items-center gap-1">
                                        <RefreshCw size={12} /> Refresh
                                    </button>
                                </div>
                                <div dangerouslySetInnerHTML={{ 
                                    __html: brief
                                        .replace(/\n/g, '<br/>')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                        .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-pidgey-accent mb-2">$1</h1>')
                                        .replace(/^## (.*$)/gim, '<h2 class="text-md font-bold text-pidgey-text mt-4 mb-2">$1</h2>')
                                        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-pidgey-muted">$1</li>')
                                }} />
                            </div>
                        )}
                        
                        {/* Static Quick Actions for Demo */}
                        <div className="pt-4 border-t border-pidgey-border">
                            <h4 className="text-xs font-bold text-pidgey-muted uppercase mb-3">Recommended Actions</h4>
                            <div className="space-y-2">
                                <button className="w-full text-left p-3 rounded-lg bg-pidgey-panel border border-pidgey-border hover:border-red-500/50 transition flex items-start gap-3">
                                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <div className="text-sm font-medium text-white">Review Abandoned Carts</div>
                                        <div className="text-xs text-pidgey-muted">7 users waiting ($850 value)</div>
                                    </div>
                                </button>
                                <button className="w-full text-left p-3 rounded-lg bg-pidgey-panel border border-pidgey-border hover:border-yellow-500/50 transition flex items-start gap-3">
                                    <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <div className="text-sm font-medium text-white">Check Webhooks</div>
                                        <div className="text-xs text-pidgey-muted">2 recent failures detected</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-pidgey-accent text-pidgey-dark font-medium' 
                                            : 'bg-pidgey-panel border border-pidgey-border text-pidgey-text'
                                    }`}>
                                        <div dangerouslySetInnerHTML={{ 
                                            __html: msg.content.replace(/\n/g, '<br/>') 
                                        }} />
                                        <div className={`text-[10px] mt-1 opacity-70 ${msg.role === 'user' ? 'text-pidgey-dark' : 'text-pidgey-muted'}`}>
                                            {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-pidgey-panel border border-pidgey-border rounded-xl p-3 flex gap-1">
                                        <span className="w-2 h-2 bg-pidgey-muted rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-pidgey-muted rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-pidgey-muted rounded-full animate-bounce delay-200"></span>
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
                                    placeholder="Ask Jarvis..."
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-pidgey-accent text-white placeholder-pidgey-muted"
                                />
                                <button 
                                    onClick={() => handleSendMessage()}
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-pidgey-accent text-pidgey-dark rounded hover:bg-teal-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                             <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {['Show revenue', 'List errors', 'Analyze drops', 'Help me triage'].map(suggestion => (
                                    <button 
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="whitespace-nowrap px-2 py-1 rounded bg-pidgey-dark border border-pidgey-border text-xs text-pidgey-muted hover:text-pidgey-text hover:border-pidgey-muted transition"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};