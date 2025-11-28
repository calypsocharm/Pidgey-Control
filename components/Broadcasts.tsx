
import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Send, Mail, Smartphone, Bell, Plus, RefreshCw, BarChart2 } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Broadcast, BroadcastStatus, BroadcastChannel } from '../types';

export const Broadcasts = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await AdminService.broadcasts.list();
        setBroadcasts(data);
        setLoading(false);
    };

    const getStatusColor = (status: BroadcastStatus) => {
        switch(status) {
            case BroadcastStatus.DRAFT: return 'bg-slate-700 text-slate-300';
            case BroadcastStatus.SCHEDULED: return 'bg-yellow-500/20 text-yellow-400';
            case BroadcastStatus.SENDING: return 'bg-blue-500/20 text-blue-400 animate-pulse';
            case BroadcastStatus.SENT: return 'bg-green-500/20 text-green-400';
            case BroadcastStatus.CANCELLED: return 'bg-red-500/20 text-red-400';
            default: return 'bg-slate-700';
        }
    };

    const ChannelIcon = ({ channel }: { channel: BroadcastChannel }) => {
        switch(channel) {
            case BroadcastChannel.EMAIL: return <Mail size={14} />;
            case BroadcastChannel.SMS: return <Smartphone size={14} />;
            case BroadcastChannel.PUSH: return <Bell size={14} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-pidgey-secondary/10 rounded-lg text-pidgey-secondary">
                        <Megaphone size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Broadcasts</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-pidgey-secondary text-white font-bold rounded-lg hover:bg-purple-600 transition">
                    <Plus size={18} /> New Broadcast
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-pidgey-panel border border-pidgey-border p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-pidgey-muted text-xs font-bold uppercase">Scheduled</p>
                        <h3 className="text-2xl font-bold mt-1">3</h3>
                    </div>
                    <Calendar className="text-pidgey-muted opacity-50" />
                </div>
                <div className="bg-pidgey-panel border border-pidgey-border p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-pidgey-muted text-xs font-bold uppercase">Avg. Open Rate</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-400">42.5%</h3>
                    </div>
                    <BarChart2 className="text-green-500 opacity-50" />
                </div>
                 <div className="bg-pidgey-panel border border-pidgey-border p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-pidgey-muted text-xs font-bold uppercase">Total Sent</p>
                        <h3 className="text-2xl font-bold mt-1">142k</h3>
                    </div>
                    <Send className="text-blue-500 opacity-50" />
                </div>
            </div>

            {/* List */}
            <div className="bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-pidgey-border flex justify-between items-center">
                    <div className="flex gap-2">
                        {['all', 'draft', 'scheduled', 'sent'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${
                                    filter === f ? 'bg-pidgey-text text-pidgey-dark' : 'text-pidgey-muted hover:bg-pidgey-dark'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchData} className="text-pidgey-muted hover:text-white"><RefreshCw size={16}/></button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-pidgey-dark/50 text-xs uppercase text-pidgey-muted font-semibold">
                            <tr>
                                <th className="px-6 py-4">Campaign Name</th>
                                <th className="px-6 py-4">Channels</th>
                                <th className="px-6 py-4">Audience</th>
                                <th className="px-6 py-4">Schedule / Sent</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Metrics</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pidgey-border">
                            {broadcasts.map(bc => (
                                <tr key={bc.id} className="hover:bg-pidgey-dark/30 group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{bc.name}</div>
                                        <div className="text-xs text-pidgey-muted">{bc.subject}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {bc.channels.map(c => (
                                                <div key={c} className="p-1.5 bg-pidgey-dark rounded border border-pidgey-border text-pidgey-muted" title={c}>
                                                    <ChannelIcon channel={c} />
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{bc.audience_segment}</div>
                                        <div className="text-xs text-pidgey-muted">{bc.audience_size?.toLocaleString()} recipients</div>
                                    </td>
                                    <td className="px-6 py-4 text-pidgey-muted font-mono text-xs">
                                        {bc.scheduled_at ? new Date(bc.scheduled_at).toLocaleDateString() : '-'}
                                        <br/>
                                        {bc.scheduled_at ? new Date(bc.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(bc.status)}`}>
                                            {bc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {bc.status === BroadcastStatus.SENT ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-green-400 font-bold">{Math.round((bc.stats?.opened || 0) / (bc.stats?.delivered || 1) * 100)}% Open</span>
                                                <span className="text-xs text-pidgey-muted">{(bc.stats?.clicked || 0).toLocaleString()} Clicks</span>
                                            </div>
                                        ) : (
                                            <span className="text-pidgey-muted">-</span>
                                        )}
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
