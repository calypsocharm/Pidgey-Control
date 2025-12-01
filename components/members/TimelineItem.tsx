import React from 'react';
import { CreditCard, Ticket, Stamp, Activity } from 'lucide-react';

export interface TimelineEvent {
    id: string;
    type: 'transaction' | 'log' | 'ticket' | 'card';
    date: string;
    title: string;
    description?: string;
    amount?: number;
    status?: string;
    meta?: any;
}

export const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
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
                    <span className="font-bold text-sm text-pidgey-text">{event.title}</span>
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
