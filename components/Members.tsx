import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, X, Save, Sparkles } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Profile, Role, Tier } from '../types';
import { generateFormContent } from '../services/geminiService';
import { MemberDrawer } from './members/MemberDrawer';

export const Members = () => {
    // List State
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Player 360 Drawer State
    const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

    // Add Member Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMember, setNewMember] = useState<Partial<Profile>>({ role: Role.USER, tier: Tier.FREE, egg_balance: { standard: 3, premium: 0, mystery: 0 }, status: 'active' });
    const [isFilling, setIsFilling] = useState(false);

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

    const handleAddMember = async () => {
        if (!newMember.email || !newMember.full_name) return alert("Email and Name required");
        
        console.log("Creating new member:", newMember);
        
        const { data, error } = await AdminService.profiles.create(newMember);
        
        if (error) {
            console.error('Pidgey Chirp! Error creating member:', error);
            // Safely extract error message to prevent [object Object] alert
            const errMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            alert(`Failed to create member: ${errMsg}`);
        } else {
            console.log('Feathers Up! Member created successfully:', data);
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
                role: Object.values(Role).includes(data.role) ? data.role : Role.USER,
                tier: Object.values(Tier).includes(data.tier) ? data.tier : Tier.FREE,
            });
        }
        setIsFilling(false);
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
                                        onClick={() => setSelectedMember(profile)}
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
            <MemberDrawer 
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
                onUpdateMember={fetchMembers}
            />

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
