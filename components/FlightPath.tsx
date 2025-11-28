
import React, { useState } from 'react';
import { 
    Search, Plane, MapPin, Mail, Eye, MousePointer, 
    HardDrive, UserPlus, AlertTriangle, CheckCircle, 
    XCircle, ArrowRight, CornerUpRight, Undo2,
    Settings, DownloadCloud, Key, RefreshCw
} from 'lucide-react';
import { AdminService } from '../services/adminService';
import { DeliveryJourney, DeliveryStatus, MessageEvent } from '../types';

export const FlightPath = () => {
    const [query, setQuery] = useState('flight_404'); // Pre-fill with a failed flight for demo
    const [journeys, setJourneys] = useState<DeliveryJourney[]>([]);
    const [selectedJourney, setSelectedJourney] = useState<DeliveryJourney | null>(null);
    const [loading, setLoading] = useState(false);

    // SMTP Config State
    const [showConfig, setShowConfig] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('smtp2go_key') || '');
    const [isSyncing, setIsSyncing] = useState(false);

    // Rescue State
    const [rescueEmail, setRescueEmail] = useState('');
    const [isRescuing, setIsRescuing] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        const results = await AdminService.flightPath.search(query);
        setJourneys(results);
        if (results.length > 0) {
            setSelectedJourney(results[0]);
            setRescueEmail(results[0].recipient); // Pre-fill
        } else {
            setSelectedJourney(null);
        }
        setLoading(false);
    };

    const handleSyncLogs = async () => {
        if (!apiKey) return alert("Please enter SMTP2GO API Key");
        
        setIsSyncing(true);
        localStorage.setItem('smtp2go_key', apiKey); // Persist
        
        try {
            const newLogs = await AdminService.flightPath.syncSmtpGo(apiKey);
            setJourneys(prev => [...newLogs, ...prev]);
            alert(`Sync complete. Found ${newLogs.length} new records.`);
        } catch (e) {
            alert("Sync failed. Check API Key.");
        }
        setIsSyncing(false);
    }

    const handleReroute = async () => {
        if (!selectedJourney || !rescueEmail) return;
        setIsRescuing(true);
        try {
            const updatedJourney = await AdminService.flightPath.reroute(selectedJourney.message_id, rescueEmail);
            setSelectedJourney(updatedJourney);
            // Update list as well
            setJourneys(prev => prev.map(j => j.message_id === updatedJourney.message_id ? updatedJourney : j));
            alert("Pidgey rescued! Rerouted to " + rescueEmail);
        } catch (e) {
            alert("Rescue failed.");
        }
        setIsRescuing(false);
    };

    const handleReturnToSender = async () => {
        if (!selectedJourney) return;
        if (!confirm("This will refund the egg cost to the sender and notify them that delivery failed. Proceed?")) return;
        
        setIsRescuing(true);
        try {
            const updatedJourney = await AdminService.flightPath.returnToSender(selectedJourney.message_id);
            setSelectedJourney(updatedJourney);
             setJourneys(prev => prev.map(j => j.message_id === updatedJourney.message_id ? updatedJourney : j));
            alert("Returned to sender. Egg refunded.");
        } catch (e) {
            alert("Action failed.");
        }
        setIsRescuing(false);
    };

    // Auto-search on mount if query exists
    React.useEffect(() => {
        if (query) handleSearch();
    }, []);

    const getIcon = (status: DeliveryStatus) => {
        switch(status) {
            case DeliveryStatus.SENT: return <Mail size={20} />;
            case DeliveryStatus.DELIVERED: return <CheckCircle size={20} />;
            case DeliveryStatus.OPENED: return <Eye size={20} />;
            case DeliveryStatus.CLICKED: return <MousePointer size={20} />;
            case DeliveryStatus.CARD_VIEWED: return <MapPin size={20} />;
            case DeliveryStatus.MEMORY_SAVED: return <HardDrive size={20} />;
            case DeliveryStatus.REFERRAL_CONVERTED: return <UserPlus size={20} />;
            case DeliveryStatus.CARD_NOT_FOUND: 
            case DeliveryStatus.BOUNCED:
            case DeliveryStatus.RENDER_ERROR: return <XCircle size={20} />;
            case DeliveryStatus.RESCUED: return <CornerUpRight size={20} />;
            case DeliveryStatus.RETURNED_TO_SENDER: return <Undo2 size={20} />;
            default: return <Plane size={20} />;
        }
    };

    const getStepColor = (status: DeliveryStatus) => {
         if (status.includes('fail') || status === 'bounced' || status === 'card_not_found') return 'bg-red-500 text-white';
         if (status === 'referral_converted') return 'bg-purple-500 text-white';
         if (status === 'memory_saved') return 'bg-pink-500 text-white';
         if (status === 'rescued') return 'bg-blue-400 text-pidgey-dark';
         if (status === 'returned_to_sender') return 'bg-orange-400 text-pidgey-dark';
         return 'bg-pidgey-accent text-pidgey-dark';
    };

    const isFailedState = (status: DeliveryStatus) => {
        return [DeliveryStatus.BOUNCED, DeliveryStatus.FAILED, DeliveryStatus.CARD_NOT_FOUND, DeliveryStatus.RENDER_ERROR].includes(status);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col space-y-6">
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                     <div className="p-2 bg-pidgey-secondary/10 rounded-lg text-pidgey-secondary">
                        <Plane size={24} className="transform rotate-45" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Flight Path</h1>
                        <p className="text-xs text-pidgey-muted">Complete lifecycle tracking from Send to Referral.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                        showConfig ? 'bg-pidgey-accent text-pidgey-dark border-pidgey-accent' : 'bg-transparent border-pidgey-border text-pidgey-muted hover:text-white'
                    }`}
                >
                    <Settings size={16} /> SMTP2GO Config
                </button>
            </div>

            {/* SMTP Config Panel */}
            {showConfig && (
                <div className="bg-pidgey-panel border border-pidgey-border rounded-xl p-6 animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <DownloadCloud size={18} /> Import Data from Provider
                    </h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">SMTP2GO API Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={16} />
                                <input 
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your API Key..."
                                    className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-pidgey-accent outline-none"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleSyncLogs}
                            disabled={isSyncing}
                            className="px-6 py-2.5 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <DownloadCloud size={18} />}
                            {isSyncing ? 'Syncing...' : 'Bring in Data'}
                        </button>
                    </div>
                    <p className="text-xs text-pidgey-muted mt-3">
                        This will query the external API for recent delivery attempts and merge them into the timeline view.
                    </p>
                </div>
            )}

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-4 bg-pidgey-panel p-4 rounded-xl border border-pidgey-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={18} />
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter Message ID, Recipient Email, or Card ID..."
                        className="w-full bg-pidgey-dark border border-pidgey-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-pidgey-accent text-white"
                    />
                </div>
                <button type="submit" className="px-6 py-3 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition">
                    Trace Flight
                </button>
            </form>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left: Journey List */}
                <div className="w-1/4 bg-pidgey-panel border border-pidgey-border rounded-xl overflow-y-auto">
                    {journeys.length === 0 && !loading && (
                        <div className="p-8 text-center text-pidgey-muted">
                            <Plane size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No flights found.</p>
                        </div>
                    )}
                    {journeys.map(j => (
                        <div 
                            key={j.message_id}
                            onClick={() => { setSelectedJourney(j); setRescueEmail(j.recipient); }}
                            className={`p-4 border-b border-pidgey-border cursor-pointer transition-colors ${
                                selectedJourney?.message_id === j.message_id 
                                ? 'bg-pidgey-dark border-l-4 border-l-pidgey-accent' 
                                : 'hover:bg-pidgey-dark/50'
                            }`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-mono text-xs text-pidgey-muted">{j.message_id}</span>
                                <span className="text-xs text-pidgey-muted">{new Date(j.started_at).toLocaleDateString()}</span>
                            </div>
                            <div className="font-bold text-sm truncate mb-1">{j.recipient}</div>
                            <div className={`text-xs inline-block px-2 py-0.5 rounded uppercase font-bold ${
                                isFailedState(j.current_status) ? 'bg-red-500/20 text-red-400' : 
                                j.current_status === DeliveryStatus.RESCUED ? 'bg-blue-400/20 text-blue-300' :
                                'bg-green-500/20 text-green-400'
                            }`}>
                                {j.current_status.replace(/_/g, ' ')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Visual Timeline */}
                <div className="flex-1 bg-pidgey-dark border border-pidgey-border rounded-xl p-8 overflow-y-auto relative">
                    {selectedJourney ? (
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-8 flex justify-between items-end border-b border-pidgey-border pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Flight Path: {selectedJourney.message_id}</h2>
                                    <p className="text-pidgey-muted text-sm">Recipient: <span className="text-white">{selectedJourney.recipient}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-pidgey-muted uppercase font-bold">Total Duration</p>
                                    <p className="font-mono text-lg">
                                        {Math.round((new Date(selectedJourney.updated_at).getTime() - new Date(selectedJourney.started_at).getTime()) / 1000 / 60)} mins
                                    </p>
                                </div>
                            </div>

                            {/* RESCUE ZONE */}
                            {isFailedState(selectedJourney.current_status) && (
                                <div className="mb-8 bg-red-900/10 border border-red-500/30 rounded-xl p-6 animate-pulse-slow">
                                    <div className="flex items-center gap-2 text-red-400 mb-4">
                                        <AlertTriangle size={20} />
                                        <h3 className="font-bold uppercase tracking-wide">Flight Interrupted - Rescue Required</h3>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-pidgey-dark p-4 rounded-lg border border-pidgey-border">
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Option A: Reroute Pidgey</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="email" 
                                                    value={rescueEmail} 
                                                    onChange={(e) => setRescueEmail(e.target.value)}
                                                    className="flex-1 bg-pidgey-panel border border-pidgey-border rounded px-3 py-2 text-sm text-white focus:border-pidgey-accent outline-none"
                                                    placeholder="Correct Email Address"
                                                />
                                                <button 
                                                    onClick={handleReroute}
                                                    disabled={isRescuing}
                                                    className="bg-pidgey-accent text-pidgey-dark font-bold px-4 py-2 rounded hover:bg-teal-300 transition text-sm flex items-center gap-2"
                                                >
                                                    <CornerUpRight size={16} /> Reroute
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-pidgey-muted mt-2">Will trigger a new send attempt to the updated address.</p>
                                        </div>
                                        <div className="w-px bg-pidgey-border"></div>
                                        <div className="flex-1 bg-pidgey-dark p-4 rounded-lg border border-pidgey-border flex flex-col justify-between">
                                            <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2">Option B: Recall Pidgey</label>
                                            <button 
                                                onClick={handleReturnToSender}
                                                disabled={isRescuing}
                                                className="w-full bg-red-500/20 text-red-300 font-bold px-4 py-2 rounded hover:bg-red-500/30 transition text-sm flex items-center justify-center gap-2"
                                            >
                                                <Undo2 size={16} /> Return to Sender
                                            </button>
                                            <p className="text-[10px] text-pidgey-muted mt-2">Refunds egg cost and notifies sender of failure.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timeline Items */}
                            <div className="space-y-0 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-pidgey-border z-0"></div>

                                {selectedJourney.events.map((event, idx) => (
                                    <div key={event.id} className="relative z-10 flex gap-6 pb-12 last:pb-0 group">
                                        <div className={`w-12 h-12 rounded-full border-4 border-pidgey-dark flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${getStepColor(event.status)}`}>
                                            {getIcon(event.status)}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg uppercase tracking-wide">{event.status.replace(/_/g, ' ')}</h3>
                                                <span className="font-mono text-xs text-pidgey-muted">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            
                                            {/* Metadata Box */}
                                            {event.meta && (
                                                <div className="bg-pidgey-panel border border-pidgey-border rounded-lg p-3 text-xs font-mono text-pidgey-muted overflow-x-auto">
                                                    {Object.entries(event.meta).map(([k, v]) => (
                                                        <div key={k} className="flex gap-2">
                                                            <span className="text-pidgey-accent">{k}:</span>
                                                            <span className="text-white">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* End State */}
                                <div className="pt-12 flex gap-6 opacity-50">
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-pidgey-muted flex items-center justify-center bg-pidgey-dark text-pidgey-muted">
                                        <div className="w-2 h-2 bg-pidgey-muted rounded-full"></div>
                                    </div>
                                    <div className="pt-3 text-pidgey-muted italic text-sm">End of journey</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-pidgey-muted">
                            <Plane size={64} className="mb-4 text-pidgey-border" />
                            <p className="text-lg">Select a flight to view the path</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
