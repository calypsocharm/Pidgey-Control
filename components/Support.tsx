import React, { useState } from 'react';
import { Mail, Clock, Bot, Send } from 'lucide-react';
import { Ticket } from '../types';
import { MOCK_TICKETS, MOCK_PROFILES } from '../constants';
import { generateTicketReply } from '../services/geminiService';

export const Support = () => {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [aiDraft, setAiDraft] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [replyText, setReplyText] = useState('');

    const handleSelectTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setAiDraft('');
        setReplyText('');
    };

    const handleGenerateAi = async () => {
        if (!selectedTicket) return;
        setIsGenerating(true);
        const profile = MOCK_PROFILES.find(p => p.id === selectedTicket.profile_id) || MOCK_PROFILES[0];
        
        try {
            const draft = await generateTicketReply(selectedTicket, profile);
            setAiDraft(draft);
            setReplyText(draft);
        } catch(e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Ticket List */}
            <div className="w-1/3 flex flex-col bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-pidgey-border bg-pidgey-dark/30">
                    <h2 className="font-bold">Tickets Queue</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {MOCK_TICKETS.map(ticket => {
                        const profile = MOCK_PROFILES.find(p => p.id === ticket.profile_id);
                        return (
                            <div 
                                key={ticket.id} 
                                onClick={() => handleSelectTicket(ticket)}
                                className={`p-4 border-b border-pidgey-border cursor-pointer hover:bg-pidgey-dark/50 transition-colors ${
                                    selectedTicket?.id === ticket.id ? 'bg-pidgey-dark border-l-4 border-l-pidgey-accent' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm truncate pr-2">{ticket.subject}</h4>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                        ticket.priority === 'urgent' ? 'bg-red-900 text-red-300' : 'bg-slate-700 text-slate-300'
                                    }`}>{ticket.priority}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                     <span className={`w-2 h-2 rounded-full ${ticket.status === 'new' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                                     <span className="text-xs text-pidgey-muted capitalize">{ticket.status}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={profile?.avatar_url} className="w-5 h-5 rounded-full" />
                                    <span className="text-xs text-pidgey-muted">{profile?.full_name}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Ticket Detail */}
            <div className="flex-1 bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden flex flex-col">
                {selectedTicket ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-pidgey-border flex justify-between items-start bg-pidgey-dark/20">
                            <div>
                                <h2 className="text-xl font-bold mb-2">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-3 text-sm text-pidgey-muted">
                                    <span className="flex items-center gap-1"><Clock size={14}/> {new Date(selectedTicket.created_at).toLocaleString()}</span>
                                    <span className="px-2 py-0.5 rounded bg-pidgey-border text-xs">#{selectedTicket.id}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 border border-pidgey-border rounded text-sm hover:bg-pidgey-dark">Close Ticket</button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedTicket.messages.map(msg => (
                                <div key={msg.id} className={`flex gap-4 ${msg.sender_type !== 'member' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`max-w-[80%] rounded-xl p-4 ${
                                        msg.sender_type === 'member' 
                                            ? 'bg-pidgey-dark border border-pidgey-border' 
                                            : 'bg-pidgey-accent/10 border border-pidgey-accent/20 text-pidgey-accent'
                                    }`}>
                                        <p className="text-sm leading-relaxed">{msg.body}</p>
                                    </div>
                                </div>
                            ))}
                            
                            {/* AI Suggestion Box */}
                            {aiDraft && (
                                <div className="mx-auto w-full max-w-[80%] mb-4">
                                     <div className="bg-pidgey-secondary/10 border border-pidgey-secondary/30 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-2 mb-2 text-pidgey-secondary text-xs font-bold uppercase tracking-wider">
                                            <Bot size={14} /> Pidgey AI Suggestion
                                        </div>
                                        <p className="text-sm text-pidgey-text/90 italic mb-3">"{aiDraft}"</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setReplyText(aiDraft)} className="text-xs bg-pidgey-secondary text-white px-3 py-1 rounded hover:bg-purple-600 transition">Use this</button>
                                            <button onClick={() => setAiDraft('')} className="text-xs text-pidgey-muted hover:text-white px-2">Discard</button>
                                        </div>
                                     </div>
                                </div>
                            )}
                        </div>

                        {/* Composer */}
                        <div className="p-4 border-t border-pidgey-border bg-pidgey-dark/30">
                            <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={handleGenerateAi}
                                    disabled={isGenerating}
                                    className="flex items-center gap-2 text-xs text-pidgey-secondary hover:text-purple-300 transition disabled:opacity-50"
                                >
                                    <Bot size={14} />
                                    {isGenerating ? 'Thinking...' : 'Generate AI Draft'}
                                </button>
                            </div>
                            <div className="relative">
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-xl p-3 text-sm focus:outline-none focus:border-pidgey-accent pr-12 min-h-[100px]"
                                    placeholder="Type your reply..."
                                />
                                <button className="absolute bottom-3 right-3 p-2 bg-pidgey-accent text-pidgey-dark rounded-lg hover:bg-teal-300 transition">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-pidgey-muted">
                        <Mail size={48} className="mb-4 opacity-50" />
                        <p>Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
