import React, { useState, useEffect } from 'react';
import { X, Ban, Egg, Megaphone, UserCog, History } from 'lucide-react';
import { Profile, Tier, Transaction, Ticket } from '../../types';
import { AdminService } from '../../services/adminService';
import { TimelineItem, TimelineEvent } from './TimelineItem';

interface MemberDrawerProps {
    member: Profile | null;
    onClose: () => void;
    onUpdateMember: () => void;
}

export const MemberDrawer: React.FC<MemberDrawerProps> = ({ member, onClose, onUpdateMember }) => {
    const [localMember, setLocalMember] = useState<Profile | null>(member);
    const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // Aggregated 360 Data
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [stats, setStats] = useState({
        lifetimeRevenue: 0,
        eggsSpent: 0,
        cardCount: 0
    });

    // Economy Action State
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [eggAdjustment, setEggAdjustment] = useState({ amount: 0, type: 'standard' as 'standard'|'premium', reason: '' });

    useEffect(() => {
        setLocalMember(member);
        if (member) {
            fetchMemberDetails(member.id);
        }
    }, [member]);

    const fetchMemberDetails = async (id: string) => {
        setLoadingDetails(true);
        const details = await AdminService.profiles.getCompleteProfile(id);
        
        if (details) {
            const mergedTimeline: TimelineEvent[] = [];

            details.transactions.forEach((t: Transaction) => mergedTimeline.push({
                id: t.id,
                type: 'transaction',
                date: t.created_at,
                title: t.description,
                amount: Number(t.amount),
                status: t.status,
                description: `Payment ${t.status}`
            }));

            details.logs.forEach((l: any) => mergedTimeline.push({
                id: l.id,
                type: 'log',
                date: l.created_at,
                title: l.action_type || 'System Event',
                description: l.description
            }));

            details.tickets.forEach((t: Ticket) => mergedTimeline.push({
                id: t.id,
                type: 'ticket',
                date: t.created_at,
                title: `Ticket: ${t.subject}`,
                status: t.status,
                description: `Priority: ${t.priority}`
            }));

            details.cards.forEach((c: any) => mergedTimeline.push({
                id: c.id,
                type: 'card',
                date: c.created_at || new Date().toISOString(),
                title: 'Stamp Acquired',
                description: 'New asset added to collection'
            }));

            mergedTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setTimeline(mergedTimeline);
            setStats(details.stats);
        }
        setLoadingDetails(false);
    };

    const handleSuspend = async () => {
        if (!localMember) return;
        const newStatus = localMember.status === 'suspended' ? 'active' : 'suspended';
        if (newStatus === 'suspended' && !confirm("Suspend this member? They won't be able to login.")) return;
        
        await AdminService.profiles.update(localMember.id, { status: newStatus });
        setLocalMember({ ...localMember, status: newStatus });
        onUpdateMember();
        alert(`Member ${newStatus === 'active' ? 'reactivated' : 'suspended'}.`);
    };

    const handleToggleTier = async () => {
        if (!localMember) return;
        const newTier = localMember.tier === Tier.FREE ? Tier.PREMIUM : Tier.FREE;
        if (!confirm(`Switch user to ${newTier}?`)) return;
        
        await AdminService.profiles.update(localMember.id, { tier: newTier });
        setLocalMember({ ...localMember, tier: newTier });
        onUpdateMember();
    };

    const handleDraftBroadcast = () => {
        if (!localMember) return;
        alert(`Draft created for ${localMember.email}! (Redirecting to Broadcasts...)`);
    };

    const handleIssueEggs = async () => {
        if (!localMember || eggAdjustment.amount === 0) return;
        
        await AdminService.profiles.adjustBalance(localMember.id, eggAdjustment.amount, eggAdjustment.type, eggAdjustment.reason);
        
        const newBalance = { ...localMember.egg_balance };
        newBalance[eggAdjustment.type] = (newBalance[eggAdjustment.type] || 0) + eggAdjustment.amount;
        
        setLocalMember({ ...localMember, egg_balance: newBalance });
        
        // Optimistic log
        setTimeline(prev => [{
            id: 'temp_' + Date.now(),
            type: 'log',
            date: new Date().toISOString(),
            title: 'Admin Adjustment',
            description: `Adjusted ${eggAdjustment.type} eggs by ${eggAdjustment.amount}`
        }, ...prev]);

        setEggAdjustment({ amount: 0, type: 'standard', reason: '' });
        setIsIssueModalOpen(false);
        onUpdateMember();
    };

    if (!localMember) return null;

    return (
        <div className="w-[450px] bg-pidgey-panel border-l border-pidgey-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* 1. CORE IDENTITY */}
            <div className="p-6 border-b border-pidgey-border bg-pidgey-dark relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded text-pidgey-muted hover:text-white">
                    <X size={20} />
                </button>
                
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-pidgey-border overflow-hidden ring-4 ring-pidgey-panel shadow-lg">
                        <img src={localMember.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{localMember.full_name}</h2>
                        <p className="text-pidgey-muted text-sm flex items-center gap-1"><span className="select-all">{localMember.email}</span></p>
                        <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                localMember.status === 'banned' ? 'bg-red-500 text-white' : 
                                localMember.status === 'suspended' ? 'bg-orange-500 text-white' : 'bg-green-500 text-pidgey-dark'
                            }`}>{localMember.status || 'Active'}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-pidgey-border text-white`}>
                                {localMember.tier}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-pidgey-muted font-mono bg-black/20 p-2 rounded">
                    <span>ID: {localMember.id}</span>
                    <span>Seen: {localMember.last_seen ? new Date(localMember.last_seen).toLocaleDateString() : 'Never'}</span>
                </div>
            </div>

            {/* 2. QUICK ACTIONS */}
            <div className="grid grid-cols-4 border-b border-pidgey-border divide-x divide-pidgey-border bg-pidgey-panel">
                <button onClick={handleSuspend} className="p-3 hover:bg-white/5 flex flex-col items-center gap-1 text-[10px] font-bold text-pidgey-muted hover:text-red-400 transition">
                    <Ban size={16} />
                    {localMember.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
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

            {/* 3. STATS GRID */}
            <div className="p-6 border-b border-pidgey-border bg-pidgey-dark/30">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 text-center">
                        <div className="text-[10px] font-bold text-pidgey-muted uppercase mb-1">Egg Balance</div>
                        <div className="text-xl font-bold text-yellow-400">{localMember.egg_balance?.standard || 0}</div>
                        <div className="text-[9px] text-pidgey-muted">{localMember.egg_balance?.premium || 0} Premium</div>
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

            {/* 4. TIMELINE / DETAILS */}
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
                                {JSON.stringify(localMember, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

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
        </div>
    );
};
