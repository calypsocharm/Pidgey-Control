
import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, CheckCircle, Eye, MousePointer, XCircle, RefreshCw, Filter, Search, Mail } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { DeliveryJourney, DeliveryStatus, BroadcastChannel } from '../types';

const getStatusIcon = (status: DeliveryStatus) => {
    switch(status) {
        case DeliveryStatus.SENT: return <Send size={16} className="text-blue-400"/>;
        case DeliveryStatus.DELIVERED: return <CheckCircle size={16} className="text-green-400"/>;
        case DeliveryStatus.OPENED: return <Eye size={16} className="text-purple-400"/>;
        case DeliveryStatus.CLICKED: return <MousePointer size={16} className="text-yellow-400"/>;
        case DeliveryStatus.CARD_VIEWED: return <CheckCircle size={16} className="text-teal-400"/>;
        case DeliveryStatus.CARD_NOT_FOUND: return <AlertTriangle size={16} className="text-red-500"/>;
        case DeliveryStatus.BOUNCED: return <XCircle size={16} className="text-red-500"/>;
        default: return <Send size={16} className="text-slate-500"/>;
    }
};

const TimelineStep: React.FC<{ event: any, isLast: boolean }> = ({ event, isLast }) => (
    <div className="flex gap-4">
            <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                event.status.includes('fail') || event.status === 'bounced' || event.status === 'card_not_found'
                ? 'bg-red-900/20 border-red-500 text-red-500' 
                : 'bg-pidgey-dark border-pidgey-accent text-pidgey-accent'
            }`}>
                {getStatusIcon(event.status)}
            </div>
            {!isLast && <div className="w-0.5 h-full bg-pidgey-border my-1"></div>}
            </div>
            <div className="pb-8">
            <div className="flex items-center gap-2">
                <span className="font-bold text-sm uppercase">{event.status.replace(/_/g, ' ')}</span>
                <span className="text-xs text-pidgey-muted">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            {event.meta && (
                <div className="mt-1 text-xs bg-pidgey-dark p-2 rounded border border-pidgey-border font-mono text-red-300">
                    {JSON.stringify(event.meta)}
                </div>
            )}
            </div>
    </div>
);

export const Deliveries = () => {
    const [deliveries, setDeliveries] = useState<DeliveryJourney[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await AdminService.deliveries.list(filter);
        setDeliveries(data);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-pidgey-panel border border-pidgey-border rounded-lg">
                        <Mail size={24} className="text-pidgey-accent" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Message Health</h1>
                        <p className="text-xs text-pidgey-muted">Track delivery journeys and lost birds.</p>
                    </div>
                </div>
                <button onClick={fetchData} className="p-2 text-pidgey-muted hover:text-white"><RefreshCw size={18}/></button>
            </div>

            {/* Main Content */}
            <div className="bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-pidgey-border flex justify-between items-center bg-pidgey-dark/30">
                     <div className="flex gap-2">
                        {['all', DeliveryStatus.BOUNCED, DeliveryStatus.CARD_NOT_FOUND].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${
                                    filter === f 
                                    ? f === 'all' ? 'bg-pidgey-text text-pidgey-dark' : 'bg-red-500 text-white' 
                                    : 'text-pidgey-muted hover:bg-pidgey-dark border border-pidgey-border'
                                }`}
                            >
                                {f.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={14} />
                        <input 
                            type="text" 
                            placeholder="Trace Message ID..." 
                            className="bg-pidgey-dark border border-pidgey-border rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-pidgey-accent text-white"
                        />
                    </div>
                </div>

                <div className="divide-y divide-pidgey-border">
                    {deliveries.map(journey => (
                        <div key={journey.message_id} className="group">
                            <div 
                                onClick={() => setExpandedId(expandedId === journey.message_id ? null : journey.message_id)}
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-pidgey-dark/50 transition-colors ${expandedId === journey.message_id ? 'bg-pidgey-dark/50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${
                                        journey.current_status === DeliveryStatus.BOUNCED || journey.current_status === DeliveryStatus.CARD_NOT_FOUND 
                                        ? 'bg-red-500/10 text-red-500' 
                                        : 'bg-green-500/10 text-green-500'
                                    }`}>
                                        {getStatusIcon(journey.current_status)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{journey.recipient}</div>
                                        <div className="text-xs text-pidgey-muted flex gap-2">
                                            <span className="font-mono">{journey.message_id}</span>
                                            <span>•</span>
                                            <span className="capitalize">{journey.channel}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className={`text-xs font-bold uppercase ${
                                            journey.current_status === DeliveryStatus.BOUNCED || journey.current_status === DeliveryStatus.CARD_NOT_FOUND ? 'text-red-400' : 'text-pidgey-accent'
                                        }`}>
                                            {journey.current_status.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-xs text-pidgey-muted">{new Date(journey.updated_at).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expanded Timeline */}
                            {expandedId === journey.message_id && (
                                <div className="p-6 bg-pidgey-dark/80 border-t border-pidgey-border animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-bold text-pidgey-muted uppercase mb-4">Delivery Journey</h4>
                                    <div className="ml-2">
                                        {journey.events.map((event, idx) => (
                                            <TimelineStep key={event.id} event={event} isLast={idx === journey.events.length - 1} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
