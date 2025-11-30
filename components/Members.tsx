
import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, X, Shield, Star, Ban, Egg, CreditCard, History, Edit2, CheckCircle2, AlertTriangle, Undo2, Save, Lock, Megaphone, Activity, Ticket, Stamp, Coins, UserCog, CalendarClock, Sparkles } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { supabase } from '../services/supabaseClient';
import { Profile, Role, Tier, Transaction } from '../types';
import { useSafeMode } from '../SafeModeContext';
import { generateFormContent } from '../services/geminiService';

// Unified Timeline Event Interface
interface TimelineEvent {
    id: string;
    type: 'transaction' | 'log' | 'ticket' | 'card';
    date: string;
    title: string;
    description?: string;
    amount?: number;
    status?: string;
    meta?: any;
}

const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
    const getIcon = () => {
        switch(event.type) {
            case 'transaction': return <CreditCard size={14} className="text-green-400" />;
            case 'ticket': return <Ticket size={14} className="text-yellow-400" />;
            case 'card': return <Stamp size={14} className="text-purple-400" />;
            default: return <Activity size={14} className="text-pidgey-muted" />;
        }
    };
    
    return (
        <div className="flex gap-4 p-3 hover:bg-pidgey-dark/30 rounded-lg transition group">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-pidgey-dark border border-pidgey-border flex items-center justify-center shadow-sm group-hover:border-pidgey-accent transition-colors">
                    {getIcon()}
                </div>
                <div className="w-px h-full bg-pidgey-border/50 my-1 group-last:hidden"></div>
            </div>
            <div className="flex-1 pb-4">
                <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-white">{event.title}</span>
                    <span className="text-[10px] text-pidgey-muted">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                {event.description && <p className="text-xs text-pidgey-muted mt-1">{event.description}</p>}
                {event.amount !== undefined && (
                    <span className={`text-xs font-mono font-bold ${event.status === 'succeeded' ? 'text-green-400' : 'text-pidgey-muted'}`}>
                        ${event.amount.toFixed(2)}
                    </span>
                )}
            </div>
        </div>
    );
};

export const Members = () => {
    // List State
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const { isSafeMode } = useSafeMode();

    // Player 360 Drawer State
    const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'economy' | 'details'>('timeline');
    
    // Aggregated 360 Data
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [stats, setStats] = useState({
        lifetimeRevenue: 0,
        eggsSpent: 0,
        cardCount: 0
    });
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Add Member Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMember, setNewMember] = useState<Partial<Profile>>({ role: Role.USER, tier: Tier.FREE, egg_balance: { standard: 3, premium: 0, mystery: 0 }, status: 'active' });
    const [isFilling, setIsFilling] = useState(false);

    // Economy Action State (Issue Eggs)
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [eggAdjustment, setEggAdjustment] = useState({ amount: 0, type: 'standard' as 'standard'|'premium', reason: '' });

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchMembers();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, page]);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, count } = await AdminService.profiles.list(page, 20, searchTerm);
        setProfiles(data);
        setTotal(count);
        setLoading(false);
    };

    const handleMemberClick = async (member: Profile) => {
        setSelectedMember(member);
        setActiveTab('timeline');
        setLoadingDetails(true);

        // Fetch Complete Profile Data (Timeline, Stats, Logs)
        const details = await AdminService.profiles.getCompleteProfile(member.id);
        
        if (details) {
            // Merge and Sort Timeline
            const mergedTimeline: TimelineEvent[] = [];

            // 1. Transactions
            details.transactions.forEach(t => mergedTimeline.push({
                id: t.id,
                type: 'transaction',
                date: t.created_at,
                title: t.description,
                amount: Number(t.amount),
                status: t.status,
                description: `Payment ${t.status}`
            }));

            // 2. Logs
            details.logs.forEach(l => mergedTimeline.push({
                id: l.id,
                type: 'log',
                date: l.created_at,
                title: l.action_type || 'System Event',
                description: l.description
            }));

            // 3. Tickets
            details.tickets.forEach(t => mergedTimeline.push({
                id: t.id,
                type: 'ticket',
                date: t.created_at,
                title: `Ticket: ${t.subject}`,
                status: t.status,
                description: `Priority: ${t.priority}`
            }));

            // 4. Stamps (Cards)
            details.cards.forEach((c: any) => mergedTimeline.push({
                id: c.id,
                type: 'card',
                date: c.created_at || new Date().toISOString(),
                title: 'Stamp Acquired',
                description: 'New asset added to collection'
            }));

            // Sort descending
            mergedTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setTimeline(mergedTimeline);
            setStats(details.stats);
        }
        setLoadingDetails(false);
    };

    const handleAddMember = async () => {
        if (!newMember.email || !newMember.full_name) return alert("Email and Name required");
        
        console.log("Creating new member:", newMember);
        
        // 1. Prepare the data payload
        const newMemberData = {
            full_name: newMember.full_name,
            email: newMember.email,
            role: newMember.role,
            tier: newMember.tier,
            status: newMember.status,
            egg_balance: newMember.egg_balance,
            // Generate a secure random ID if the DB doesn't handle it
            id: `usr_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
        };

        // 2. Execute the Supabase INSERT query
        const { data, error } = await supabase
            .from('profiles') // TARGET TABLE: profiles
            .insert([newMemberData])
            .select(); // Fetches the newly created record
        
        if (error) {
            console.error('Pidgey Chirp! Error creating member:', error);
            // Display proper error message instead of [object Object]
            alert(`Failed to create member: ${error.message || JSON.stringify(error)}`);
        } else {
            console.log('Feathers Up! Member created successfully:', data[0]);
            setIsAddModalOpen(false);
            fetchMembers();
            setNewMember({ role: Role.USER, tier: Tier.FREE, egg_balance: { standard: 3, premium: 0, mystery: 0 }, status: 'active' });
        }
    };

    const handlePidgeyFill = async () => {
        setIsFilling(true);
        const data = await generateFormContent('member');
        if (data) {
            setNewMember({
                ...newMember,
                ...data,
                // Ensure Enums align
                role: Object.values(Role).includes(data.role) ? data.role : Role.USER,
                tier: Object.values(Tier).includes(data.tier) ? data.tier : Tier.FREE,
            });
        }
        setIsFilling(false);
    };

    // --- Quick Actions ---

    const handleSuspend = async () => {
        if (!selectedMember) return;
        if (selectedMember.status === 'suspended') {
             await AdminService.profiles.update(selectedMember.id, { status: 'active' });
             setSelectedMember({ ...selectedMember, status: 'active' });
             alert("Member reactivated.");
        } else {
             if (!confirm("Suspend this member? They won't be able to login.")) return;
             await AdminService.profiles.update(selectedMember.id, { status: 'suspended' });
             setSelectedMember({ ...selectedMember, status: 'suspended' });
        }
        fetchMembers();
    };

    const handleToggleTier = async () => {
        if (!selectedMember) return;
        const newTier = selectedMember.tier === Tier.FREE ? Tier.PREMIUM : Tier.FREE; // Simplified toggle
        if (!confirm(`Switch user to ${newTier}?`)) return;
        
        await AdminService.profiles.update(selectedMember.id, { tier: newTier });
        setSelectedMember({ ...selectedMember, tier: newTier });
        fetchMembers();
    };

    const handleDraftBroadcast = () => {
        if (!selectedMember) return;
        alert(`Draft created for ${selectedMember.email}! (Redirecting to Broadcasts...)`);
        // In real app: navigate(`/broadcasts?draft_for=${selectedMember.id}`)
    };

    const handleIssueEggs = async () => {
        if (!selectedMember || eggAdjustment.amount === 0) return;
        
        await AdminService.profiles.adjustBalance(selectedMember.id, eggAdjustment.amount, eggAdjustment.type, eggAdjustment.reason);
        
        // Update local
        const newBalance = { ...selectedMember.egg_balance };
        newBalance[eggAdjustment.type] = (newBalance[eggAdjustment.type] || 0) + eggAdjustment.amount;
        
        const updatedMember = { ...selectedMember, egg_balance: newBalance };
        setSelectedMember(updatedMember);
        
        // Add optimistic log to timeline
        setTimeline(prev => [{
            id: 'temp_' + Date.now(),
            type: 'log',
            date: new Date().toISOString(),
            title: 'Admin Adjustment',
            description: `Adjusted ${eggAdjustment.type} eggs by ${eggAdjustment.amount}`
        }, ...prev]);

        setEggAdjustment({ amount: 0, type: 'standard', reason: '' });
        setIsIssueModalOpen(false);
    };

    const getStatusBadge = (status: string | undefined) => {
        switch(status) {
            case 'banned': 
                return <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase">Banned</span>;
            case 'suspended':
                return <span className="text-xs font-bold bg-orange-500/20 text-orange-400 px-2 py-1 rounded uppercase">Suspended</span>;
            default:
                return <span className="text-xs font-bold text-green-400">Active</span>;
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 relative">
            {/* LEFT: Member Directory */}
            <div className={`flex-1 flex flex-col space-y-6 transition-all duration-300 ${selectedMember ? 'w-1/2 opacity-50 pointer-events-none md:pointer-events-auto md:opacity-100' : 'w-full'}`}>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Members Directory</h1>
                    <div className="flex gap-3">
                         <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg text-sm hover:bg-teal-300 transition flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Member
                        </button>
                        <button onClick={fetchMembers} className="p-2 text-pidgey-muted hover:text-white border border-pidgey-border rounded-lg">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-pidgey-border flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search by name, email, or ID..." 
                                className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-pidgey-accent text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-pidgey-dark/50 text-xs uppercase text-pidgey-muted font-semibold sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Tier</th>
                                    <th className="px-6 py-4">Egg Balance</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pidgey-border">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-pidgey-muted">Loading...</td></tr>
                                ) : profiles.map((profile) => (
                                    <tr 
                                        key={profile.id} 
                                        onClick={() => handleMemberClick(profile)}
                                        className={`cursor-pointer transition-colors hover:bg-pidgey-dark/50 ${selectedMember?.id === profile.id ? 'bg-pidgey-dark border-l-4 border-l-pidgey-accent' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pidgey-border to-pidgey-dark flex items-center justify-center text-pidgey-muted font-bold text-[10px] overflow-hidden">
                                                    {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : (profile.full_name ? profile.full_name.substring(0,2).toUpperCase() : '??')}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-pidgey-text">{profile.full_name || 'Unknown'}</div>
                                                    <div className="text-xs text-pidgey-muted">{profile.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize text-xs text-pidgey-muted">{profile.role}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                profile.tier === Tier.PRO ? 'bg-purple-500/20 text-purple-300' : 
                                                profile.tier === Tier.PREMIUM ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                                {profile.tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 text-[10px]">
                                                <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">{profile.egg_balance?.standard ?? 0}</span>
                                                {(profile.egg_balance?.premium ?? 0) > 0 && <span className="bg-yellow-600/10 px-1.5 py-0.5 rounded text-yellow-500">{profile.egg_balance?.premium} P</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(profile.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* RIGHT: ULTIMATE MEMBER PROFILE DRAWER */}
            {selectedMember && (
                <div className="w-[450px] bg-pidgey-panel border-l border-pidgey-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    
                    {/* 1. CORE IDENTITY & STATUS */}
                    <div className="p-6 border-b border-pidgey-border bg-pidgey-dark relative">
                        <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded text-pidgey-muted hover:text-white">
                            <X size={20} />
                        </button>
                        
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-pidgey-border overflow-hidden ring-4 ring-pidgey-panel shadow-lg">
                                <img src={selectedMember.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedMember.full_name}</h2>
                                <p className="text-pidgey-muted text-sm flex items-center gap-1"><span className="select-all">{selectedMember.email}</span></p>
                                <div className="flex gap-2 mt-2">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        selectedMember.status === 'banned' ? 'bg-red-500 text-white' : 
                                        selectedMember.status === 'suspended' ? 'bg-orange-500 text-white' : 'bg-green-500 text-pidgey-dark'
                                    }`}>{selectedMember.status || 'Active'}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-pidgey-border text-white`}>
                                        {selectedMember.tier}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ID & Last Active */}
                        <div className="flex justify-between items-center text-[10px] text-pidgey-muted font-mono bg-black/20 p-2 rounded">
                            <span>ID: {selectedMember.id}</span>
                            <span>Seen: {selectedMember.last_seen ? new Date(selectedMember.last_seen).toLocaleDateString() : 'Never'}</span>
                        </div>
                    </div>

                    {/* 2. QUICK ACTIONS TOOLBAR */}
                    <div className="grid grid-cols-4 border-b border-pidgey-border divide-x divide-pidgey-border bg-pidgey-panel">
                        <button onClick={handleSuspend} className="p-3 hover:bg-white/5 flex flex-col items-center gap-1 text-[10px] font-bold text-pidgey-muted hover:text-red-400 transition">
                            <Ban size={16} />
                            {selectedMember.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button onClick={() => setIsIssueModalOpen(true)} className="p-3 hover:bg-white/5 flex flex-col items-center gap-1 text-[10px] font-bold text-pidgey-muted hover:text-yellow-400 transition">
                            <Egg size={16} />
                            Issue Eggs
                        </button>
                        <button onClick={handleDraftBroadcast} className="p-3 hover:bg-white/5 flex flex-col items-center gap-1 text-[10px] font-bold text-pidgey-muted hover:text-pidgey-accent transition">
                            <Megaphone size={16} />
                            Broadcast
                        </button>
                        <button onClick={handleToggleTier} className="p-3 hover:bg-white/5 flex flex-col items-center gap-1 text-[10px] font-bold text-pidgey-muted hover:text-blue-400 transition">
                            <UserCog size={16} />
                            Toggle Tier
                        </button>
                    </div>

                    {/* 3. MONETIZATION & STATS GRID */}
                    <div className="p-6 border-b border-pidgey-border bg-pidgey-dark/30">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 text-center">
                                <div className="text-[10px] font-bold text-pidgey-muted uppercase mb-1">Egg Balance</div>
                                <div className="text-xl font-bold text-yellow-400">{selectedMember.egg_balance?.standard || 0}</div>
                                <div className="text-[9px] text-pidgey-muted">{selectedMember.egg_balance?.premium || 0} Premium</div>
                            </div>
                            <div className="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 text-center">
                                <div className="text-[10px] font-bold text-pidgey-muted uppercase mb-1">Lifetime Rev</div>
                                <div className="text-xl font-bold text-green-400">${stats.lifetimeRevenue.toFixed(0)}</div>
                                <div className="text-[9px] text-pidgey-muted">{stats.eggsSpent} Eggs Spent</div>
                            </div>
                            <div className="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 text-center">
                                <div className="text-[10px] font-bold text-pidgey-muted uppercase mb-1">Stamps</div>
                                <div className="text-xl font-bold text-purple-400">{stats.cardCount}</div>
                                <div className="text-[9px] text-pidgey-muted">Inventory</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-pidgey-border bg-pidgey-panel">
                        <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-3 text-xs font-bold uppercase transition ${activeTab === 'timeline' ? 'border-b-2 border-pidgey-accent text-pidgey-accent' : 'text-pidgey-muted hover:text-white'}`}>
                            Timeline
                        </button>
                        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-xs font-bold uppercase transition ${activeTab === 'details' ? 'border-b-2 border-pidgey-accent text-pidgey-accent' : 'text-pidgey-muted hover:text-white'}`}>
                            Profile Data
                        </button>
                    </div>

                    {/* 4. SINGLE-VIEW TIMELINE */}
                    <div className="flex-1 overflow-y-auto p-4 bg-pidgey-panel">
                        {loadingDetails ? (
                            <div className="text-center py-8 text-pidgey-muted text-xs">Loading complete history...</div>
                        ) : activeTab === 'timeline' ? (
                            <div className="space-y-1 relative">
                                {timeline.length === 0 ? (
                                    <div className="text-center py-8 text-pidgey-muted">
                                        <History className="mx-auto mb-2 opacity-20" size={32} />
                                        <p className="text-xs">No history found for this user.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute left-7 top-4 bottom-4 w-px bg-pidgey-border/50 z-0"></div>
                                        {timeline.map((event) => (
                                            <TimelineItem key={event.id} event={event} />
                                        ))}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-pidgey-dark p-4 rounded-lg border border-pidgey-border">
                                    <h4 className="text-xs font-bold text-white uppercase mb-2">Raw Profile Data</h4>
                                    <pre className="text-[10px] text-pidgey-muted overflow-x-auto">
                                        {JSON.stringify(selectedMember, null, 2)}
                                    </pre>
                                </div>
                                <div className="bg-pidgey-dark p-4 rounded-lg border border-pidgey-border">
                                    <h4 className="text-xs font-bold text-white uppercase mb-2">Metadata</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-pidgey-muted">Joined</div>
                                        <div className="text-right">{new Date(selectedMember.created_at || '').toLocaleString()}</div>
                                        <div className="text-pidgey-muted">Role</div>
                                        <div className="text-right uppercase">{selectedMember.role}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Issue Eggs Modal */}
            {isIssueModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                     <div className="bg-pidgey-panel border border-pidgey-border rounded-xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2"><Egg className="text-yellow-400" size={18}/> Issue Eggs</h3>
                            <button onClick={() => setIsIssueModalOpen(false)}><X size={18} className="text-pidgey-muted hover:text-white" /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-pidgey-muted block mb-1">Amount</label>
                                <div className="flex gap-2">
                                     <button onClick={() => setEggAdjustment({...eggAdjustment, amount: -1})} className="p-2 bg-pidgey-dark border border-pidgey-border rounded text-white hover:bg-pidgey-border">-</button>
                                     <input 
                                        type="number" 
                                        className="flex-1 bg-pidgey-dark border border-pidgey-border rounded p-2 text-white text-center"
                                        value={eggAdjustment.amount}
                                        onChange={(e) => setEggAdjustment({...eggAdjustment, amount: parseInt(e.target.value)})}
                                    />
                                    <button onClick={() => setEggAdjustment({...eggAdjustment, amount: 1})} className="p-2 bg-pidgey-dark border border-pidgey-border rounded text-white hover:bg-pidgey-border">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-pidgey-muted block mb-1">Type</label>
                                <select 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-white text-sm"
                                    value={eggAdjustment.type}
                                    onChange={(e) => setEggAdjustment({...eggAdjustment, type: e.target.value as any})}
                                >
                                    <option value="standard">Standard Eggs</option>
                                    <option value="premium">Premium Eggs</option>
                                    <option value="mystery">Mystery Eggs</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-pidgey-muted block mb-1">Reason</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Support compensation"
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded p-2 text-white text-sm"
                                    value={eggAdjustment.reason}
                                    onChange={(e) => setEggAdjustment({...eggAdjustment, reason: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={handleIssueEggs}
                                className="w-full py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded hover:bg-teal-300 mt-2"
                            >
                                Confirm Issue
                            </button>
                        </div>
                     </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Add New Member</h2>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handlePidgeyFill}
                                    disabled={isFilling}
                                    className="text-xs flex items-center gap-1 text-pidgey-accent hover:text-white transition"
                                >
                                    <Sparkles size={12} className={isFilling ? "animate-spin" : ""} />
                                    {isFilling ? "Pidgey working..." : "Auto-Fill with Pidgey"}
                                </button>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-pidgey-muted hover:text-white"><X size={20}/></button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Full Name</label>
                                <input 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                    value={newMember.full_name || ''}
                                    onChange={e => setNewMember({...newMember, full_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Email</label>
                                <input 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                    type="email"
                                    value={newMember.email || ''}
                                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Role</label>
                                    <select 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                        value={newMember.role}
                                        onChange={e => setNewMember({...newMember, role: e.target.value as Role})}
                                    >
                                        {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Tier</label>
                                    <select 
                                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                        value={newMember.tier}
                                        onChange={e => setNewMember({...newMember, tier: e.target.value as Tier})}
                                    >
                                        {Object.values(Tier).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Status</label>
                                <select 
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                    value={newMember.status || 'active'}
                                    onChange={e => setNewMember({...newMember, status: e.target.value as any})}
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="banned">Banned</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-1">Initial Eggs (Standard)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg p-2.5 text-white"
                                    value={newMember.egg_balance?.standard}
                                    onChange={e => setNewMember({...newMember, egg_balance: { ...newMember.egg_balance!, standard: parseInt(e.target.value) }})}
                                />
                            </div>
                            <button 
                                onClick={handleAddMember}
                                className="w-full py-3 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 mt-4 flex justify-center items-center gap-2"
                            >
                                <Save size={18} /> Create Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
