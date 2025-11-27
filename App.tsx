import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { 
  Users, DollarSign, Activity, Egg, Search, Filter, 
  MoreVertical, CheckCircle, Clock, AlertCircle, Bot, Send, Mail
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

import { Layout } from './components/Layout';
import { MOCK_PROFILES, MOCK_DROPS, MOCK_STAMPS, MOCK_TICKETS } from './constants';
import { Profile, Ticket, DropStatus, Tier, StampRarity } from './types';
import { generateTicketReply, analyzeSentiment } from './services/geminiService';

// --- Dashboard Component ---
const Dashboard = () => {
  const data = [
    { name: 'Mon', revenue: 4000, eggs: 2400 },
    { name: 'Tue', revenue: 3000, eggs: 1398 },
    { name: 'Wed', revenue: 2000, eggs: 9800 },
    { name: 'Thu', revenue: 2780, eggs: 3908 },
    { name: 'Fri', revenue: 1890, eggs: 4800 },
    { name: 'Sat', revenue: 2390, eggs: 3800 },
    { name: 'Sun', revenue: 3490, eggs: 4300 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Control Tower Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '$12,450', icon: DollarSign, color: 'text-green-400' },
          { label: 'Active Members', value: '1,240', icon: Users, color: 'text-blue-400' },
          { label: 'Eggs Hatched', value: '8,302', icon: Egg, color: 'text-yellow-400' },
          { label: 'Pending Tickets', value: '14', icon: Activity, color: 'text-red-400' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-pidgey-panel border border-pidgey-border p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-pidgey-muted text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-pidgey-dark ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-pidgey-panel border border-pidgey-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6">Revenue vs Egg Hatching</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <ReTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="revenue" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="eggs" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-pidgey-panel border border-pidgey-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-start gap-3 border-b border-pidgey-border last:border-0 pb-3 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-pidgey-accent mt-2 flex-shrink-0" />
                        <div>
                            <p className="text-sm">User <span className="text-pidgey-accent">@hatter</span> hatched a <span className="text-yellow-400">Legendary</span> egg.</p>
                            <p className="text-xs text-pidgey-muted mt-1">2 mins ago</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Members Component ---
const Members = () => {
    const [filter, setFilter] = useState('');
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Members Directory</h1>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-pidgey-panel border border-pidgey-border rounded-lg text-sm hover:bg-pidgey-border transition">
                        Export CSV
                    </button>
                    <button className="px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg text-sm hover:bg-teal-300 transition">
                        Add Member
                    </button>
                </div>
            </div>

            <div className="bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-pidgey-border flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-pidgey-accent"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border border-pidgey-border rounded-lg hover:bg-pidgey-dark">
                        <Filter size={18} className="text-pidgey-muted" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-pidgey-dark/50 text-xs uppercase text-pidgey-muted font-semibold">
                            <tr>
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Balance (Egg)</th>
                                <th className="px-6 py-4">Last Seen</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pidgey-border">
                            {MOCK_PROFILES.map((profile) => (
                                <tr key={profile.id} className="hover:bg-pidgey-dark/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full bg-pidgey-border" />
                                            <div>
                                                <div className="font-medium text-pidgey-text">{profile.full_name}</div>
                                                <div className="text-xs text-pidgey-muted">{profile.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize text-sm">{profile.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            profile.tier === Tier.PRO ? 'bg-purple-500/20 text-purple-300' : 
                                            profile.tier === Tier.PREMIUM ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {profile.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 text-xs">
                                            <span title="Standard" className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{profile.egg_balance.standard} S</span>
                                            <span title="Premium" className="bg-yellow-600/20 px-1.5 py-0.5 rounded text-yellow-500">{profile.egg_balance.premium} P</span>
                                            <span title="Mystery" className="bg-pink-600/20 px-1.5 py-0.5 rounded text-pink-400">{profile.egg_balance.mystery} M</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-pidgey-muted">
                                        {new Date(profile.last_seen).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-pidgey-muted hover:text-pidgey-text">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Drops & Stamps Component ---
const Drops = () => {
    return (
        <div className="space-y-8">
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Egg className="text-pidgey-accent" /> Active Drops</h2>
                    <button className="text-sm text-pidgey-accent hover:underline">Manage Drops</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MOCK_DROPS.map(drop => (
                        <div key={drop.id} className="group relative bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden hover:border-pidgey-accent transition-colors">
                            <div className="h-32 bg-cover bg-center" style={{backgroundImage: `url(${drop.banner_path})`}}>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-xs font-bold uppercase">
                                    {drop.status}
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-lg mb-1">{drop.title}</h3>
                                <p className="text-pidgey-muted text-sm mb-4">{drop.description}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-yellow-400 font-bold">{drop.egg_price} Eggs</span>
                                    <span className="text-pidgey-muted">Ends: {new Date(drop.end_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Stamp Library</h2>
                    <button className="text-sm text-pidgey-accent hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {MOCK_STAMPS.map(stamp => (
                        <div key={stamp.id} className="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 text-center hover:-translate-y-1 transition-transform">
                            <img src={stamp.art_path} alt={stamp.name} className="w-full aspect-square rounded bg-pidgey-dark mb-3 object-cover" />
                            <p className="font-medium text-sm truncate">{stamp.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${
                                stamp.rarity === StampRarity.LEGENDARY ? 'bg-yellow-500/20 text-yellow-400' :
                                stamp.rarity === StampRarity.PIDGEY ? 'bg-pidgey-secondary/20 text-pidgey-secondary' :
                                'bg-slate-700 text-slate-300'
                            }`}>
                                {stamp.rarity}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

// --- Support Component (with Gemini Integration) ---
const Support = () => {
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

// --- App Root Component ---
const App = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/drops" element={<Drops />} />
          <Route path="/support" element={<Support />} />
          
          {/* Placeholders for other routes */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-full text-pidgey-muted">
                <div className="text-6xl mb-4">🚧</div>
                <h2 className="text-2xl font-bold mb-2">Under Construction</h2>
                <p>This module is currently being built by the Pidgey engineering flock.</p>
                <Link to="/" className="mt-6 px-4 py-2 bg-pidgey-panel border border-pidgey-border rounded hover:bg-pidgey-border">Go Home</Link>
            </div>
          } />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;