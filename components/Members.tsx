
import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, X, Shield, Star, Ban, Egg, CreditCard, History, Edit2, CheckCircle2, AlertTriangle, Undo2, Save, Lock } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Profile, Role, Tier, Transaction } from '../types';
import { useSafeMode } from '../SafeModeContext';

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
    const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'billing'>('overview');
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Add Member Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMember, setNewMember] = useState<Partial<Profile>>({ role: Role.USER, tier: Tier.FREE, egg_balance: { standard: 3, premium: 0, mystery: 0 }, status: 'active' });

    // Economy Action State
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
        setActiveTab('overview');
        // Fetch extra details like transactions
        if (member.id) {
            const txs = await AdminService.profiles.getTransactions(member.id);
            setTransactions(txs);
        }
    };

    const handleAddMember = async () => {
        if (!newMember.email || !newMember.full_name) return alert("Email and Name required");
        const { data, error } = await AdminService.profiles.create(newMember);
        if (error) {
            // Display detailed error to help debugging
            alert(`Failed to create member: ${error.message || JSON.stringify(error)}\n\nCheck if 'profiles' table exists in Database Settings.`);
        } else {
            setIsAddModalOpen(false);
            fetchMembers();
            setNewMember({ role: Role.USER, tier: Tier.FREE, egg_balance: { standard: 3, premium: 0, mystery: 0 }, status: 'active' });
        }
    };

    const handleBan = async () => {
        if (!selectedMember) return;
        
        // SAFE MODE CHECK
        if (isSafeMode) {
            const confirmName = prompt(`⚠️ SAFE MODE ENGAGED ⚠️\nTo ban this user, please type their name: ${selectedMember.full_name}`);
            if (confirmName !== selectedMember.full_name) {
                alert("Ban cancelled: Name did not match.");
                return;
            }
        }

        const reason = prompt("Enter reason for ban/suspension:");
        if (reason) {
            await AdminService.profiles.ban(selectedMember.id, reason);
            // Update local state to show ban
            setSelectedMember({ ...selectedMember, status: 'banned' });
            setProfiles(prev => prev.map(p => p.id === selectedMember.id ? { ...p, status: 'banned' as 'banned' } : p));
        }
    };

    const handleAdjustEggs = async () => {
        if (!selectedMember || eggAdjustment.amount === 0) return;
        await AdminService.profiles.adjustBalance(selectedMember.id, eggAdjustment.amount, eggAdjustment.type, eggAdjustment.reason);
        
        // Update local
        const newBalance = { ...selectedMember.egg_balance };
        newBalance[eggAdjustment.type] = (newBalance[eggAdjustment.type] || 0) + eggAdjustment.amount;
        
        const updatedMember = { ...selectedMember, egg_balance: newBalance };
        setSelectedMember(updatedMember);
        setProfiles(prev => prev.map(p => p.id === selectedMember.id ? updatedMember : p));
        
        setEggAdjustment({ amount: 0, type: 'standard', reason: '' });
        alert("Balance Updated");
    };

    const handleRefund = async (txId: string) => {
        if (isSafeMode) {
             const confirmText = prompt(`Type "REFUND" to confirm transaction reversal for ID: ${txId}`);
             if (confirmText !== "REFUND") return;
        } else {
            if (!confirm("Are you sure you want to refund this transaction?")) return;
        }

        await AdminService.profiles.refundTransaction(txId);
        setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'refunded' } : t));
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
            <div className={`flex-1 flex flex-col space-y-6 transition-all duration-300 ${selectedMember ? 'w-2/3' : 'w-full'}`}>
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
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pidgey-border to-pidgey-dark flex items-center justify-center text-pidgey-muted font-bold text-xs overflow-hidden">
                                                    {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : (profile.full_name ? profile.full_name.substring(0,2).toUpperCase() : '??')}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-pidgey-text">{profile.full_name || 'Unknown'}</div>
                                                    <div className="text-xs text-pidgey-muted">{profile.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {profile.role === Role.ADMIN && <Shield size={12} className="text-red-400" />}
                                                <span className="capitalize text-sm">{profile.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold flex w-fit items-center gap-1 ${
                                                profile.tier === Tier.PRO ? 'bg-purple-500/20 text-purple-300' : 
                                                profile.tier === Tier.PREMIUM ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                                {profile.tier === Tier.PRO && <Star size={10} fill="currentColor" />}
                                                {profile.tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 text-xs">
                                                <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">{profile.egg_balance?.standard ?? 0} S</span>
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

            {/* RIGHT: Player 360 Drawer */}
            {selectedMember && (
                <div className="w-[450px] bg-pidgey-panel border-l border-pidgey-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Drawer Header */}
                    <div className="p-6 border-b border-pidgey-border bg-pidgey-dark relative">
                        <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-pidgey-border overflow-hidden ring-4 ring-pidgey-panel">
                                <img src={selectedMember.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{selectedMember.full_name}</h2>
                                <p className="text-pidgey-muted text-sm">{selectedMember.email}</p>
                                <div className="flex gap-2 mt-2">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        selectedMember.status === 'banned' ? 'bg-red-500 text-white' : 
                                        selectedMember.status === 'suspended' ? 'bg-orange-500 text-white' : 'bg-green-500 text-pidgey-dark'
                                    }`}>{selectedMember.status || 'Active'}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pidgey-border text-pidgey-muted">
                                        ID: {selectedMember.id}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Bar */}
                        <div className="grid grid-cols-2 gap-2">
                            <button className="flex items-center justify-center gap-2 py-2 bg-pidgey-border hover:bg-pidgey-text hover:text-pidgey-dark rounded text-xs font-bold transition">
                                <Edit2 size={14} /> Edit Profile
                            </button>
                            <button 
                                onClick={handleBan}
                                className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition ${
                                    isSafeMode ? 'bg-red-900/10 text-red-300' : 'bg-red-600 text-white shadow-lg animate-pulse'
                                }`}
                            >
                                {isSafeMode && <Lock size={12} />}
                                <Ban size={14} /> {selectedMember.status === 'banned' ? 'Unban User' : 'Ban User'}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-pidgey-border">
                        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'overview' ? 'border-pidgey-accent text-pidgey-accent' : 'border-transparent text-pidgey-muted'}`}>Overview</button>
                        <button onClick={() => setActiveTab('economy')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'economy' ? 'border-pidgey-accent text-pidgey-accent' : 'border-transparent text-pidgey-muted'}`}>Economy</button>
                        <button onClick={() => setActiveTab('billing')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'billing' ? 'border-pidgey-accent text-pidgey-accent' : 'border-transparent text-pidgey-muted'}`}>Billing</button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-pidgey-panel">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-pidgey-dark p-3 rounded-lg border border-pidgey-border">
                                        <div className="text-xs text-pidgey-muted uppercase font-bold mb-1">Joined</div>
                                        <div className="font-mono text-sm">{selectedMember.created_at ? new Date(selectedMember.created_at).toLocaleDateString() : '-'}</div>
                                    </div>
                                    <div className="bg-pidgey-dark p-3 rounded-lg border border-pidgey-border">
                                        <div className="text-xs text-pidgey-muted uppercase font-bold mb-1">Last Active</div>
                                        <div className="font-mono text-sm">{selectedMember.last_seen ? new Date(selectedMember.last_seen).toLocaleDateString() : '-'}</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><History size={16}/> Activity Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center bg-pidgey-dark p-2 rounded">
                                            <span className="text-sm text-pidgey-muted">Lifetime Sends</span>
                                            <span className="font-bold">42 Cards</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-pidgey-dark p-2 rounded">
                                            <span className="text-sm text-pidgey-muted">Stamps Collected</span>
                                            <span className="font-bold">124</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-900/10 border border-yellow-700/30 rounded-lg">
                                    <h4 className="text-xs font-bold text-yellow-500 uppercase mb-2 flex items-center gap-2"><AlertTriangle size={12}/> Admin Notes</h4>
                                    <p className="text-xs text-pidgey-muted">User reported a bug with mystery eggs on Oct 24th. Compensated 2 eggs.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'economy' && (
                            <div className="space-y-6">
                                <div className="bg-pidgey-dark p-4 rounded-xl border border-pidgey-border text-center">
                                    <Egg className="mx-auto text-yellow-400 mb-2" size={32} />
                                    <div className="text-3xl font-bold text-white">{selectedMember.egg_balance?.standard || 0}</div>
                                    <div className="text-xs text-pidgey-muted uppercase font-bold">Standard Eggs</div>
                                </div>

                                <div className="bg-pidgey-dark p-4 rounded-xl border border-pidgey-border">
                                    <h3 className="text-sm font-bold mb-4">Adjust Balance</h3>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <button 
                                            onClick={() => setEggAdjustment({...eggAdjustment, amount: 1})}
                                            className={`py-2 rounded border border-pidgey-border text-sm font-bold ${eggAdjustment.amount > 0 ? 'bg-green-500/20 text-green-400 border-green-500' : 'hover:bg-pidgey-panel'}`}
                                        >
                                            + Add
                                        </button>
                                        <button 
                                             onClick={() => setEggAdjustment({...eggAdjustment, amount: -1})}
                                             className={`py-2 rounded border border-pidgey-border text-sm font-bold ${eggAdjustment.amount < 0 ? 'bg-red-500/20 text-red-400 border-red-500' : 'hover:bg-pidgey-panel'}`}
                                        >
                                            - Remove
                                        </button>
                                    </div>
                                    
                                    {eggAdjustment.amount !== 0 && (
                                        <div className="space-y-3 animate-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-xs font-bold text-pidgey-muted block mb-1">Amount</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-pidgey-panel border border-pidgey-border rounded p-2 text-white"
                                                    value={Math.abs(eggAdjustment.amount)}
                                                    onChange={(e) => setEggAdjustment({...eggAdjustment, amount: eggAdjustment.amount < 0 ? -Math.abs(Number(e.target.value)) : Math.abs(Number(e.target.value))})}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-pidgey-muted block mb-1">Reason (Audit Log)</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. Support compensation"
                                                    className="w-full bg-pidgey-panel border border-pidgey-border rounded p-2 text-white text-sm"
                                                    value={eggAdjustment.reason}
                                                    onChange={(e) => setEggAdjustment({...eggAdjustment, reason: e.target.value})}
                                                />
                                            </div>
                                            <button 
                                                onClick={handleAdjustEggs}
                                                className="w-full py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded hover:bg-teal-300"
                                            >
                                                Confirm Update
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2"><CreditCard size={16}/> Purchase History</h3>
                                <div className="space-y-2">
                                    {transactions.map(tx => (
                                        <div key={tx.id} className="bg-pidgey-dark border border-pidgey-border p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-sm">{tx.description}</div>
                                                <div className="text-xs text-pidgey-muted">{new Date(tx.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-mono text-sm ${tx.status === 'refunded' ? 'text-pidgey-muted line-through' : 'text-white'}`}>
                                                    ${tx.amount}
                                                </div>
                                                {tx.status === 'succeeded' ? (
                                                    <button 
                                                        onClick={() => handleRefund(tx.id)}
                                                        className="text-[10px] text-red-400 hover:underline flex items-center gap-1 mt-1 justify-end"
                                                    >
                                                        {isSafeMode && <Lock size={8} />}
                                                        <Undo2 size={10} /> Refund
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-pidgey-muted uppercase">Refunded</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <p className="text-sm text-pidgey-muted text-center py-4">No transactions found.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-pidgey-panel border border-pidgey-border rounded-xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Add New Member</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-pidgey-muted hover:text-white"><X size={20}/></button>
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
