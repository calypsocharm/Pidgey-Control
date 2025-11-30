
import React from 'react';
import { Bird, CheckCircle, XCircle, Clock, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import { useJarvis } from '../JarvisContext';
import { AdminService } from '../services/adminService';
import { CreationDraft } from '../types';

export const PidgeyCreations = () => {
    const { creations, removeCreation, openPidgey } = useJarvis();

    const handleApprove = async (draft: CreationDraft) => {
        if (!confirm(`Approve this ${draft.type}? It will be created in the system.`)) return;

        let result = { error: null as any };

        try {
            switch(draft.type) {
                case 'broadcast':
                    result = await AdminService.broadcasts.create(draft.data);
                    break;
                case 'drop':
                    result = await AdminService.drops.create(draft.data);
                    break;
                case 'promo':
                    // Mock create promo as logic is in Promos component primarily
                    console.log("Creating promo", draft.data);
                    break;
                case 'stamp':
                    result = await AdminService.stamps.create(draft.data);
                    break;
                case 'member':
                    result = await AdminService.profiles.create(draft.data);
                    break;
                default:
                    console.warn("Unknown draft type");
            }

            if (result.error) {
                alert(`Error creating item: ${result.error.message}`);
            } else {
                removeCreation(draft.id);
                // alert("Approved and Published!"); // Optional: Feedback is nice, but maybe invasive
            }
        } catch (e: any) {
            alert(`System error: ${e.message}`);
        }
    };

    const handleReject = (id: string) => {
        if (!confirm("Reject and delete this draft?")) return;
        removeCreation(id);
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'drop': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'broadcast': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'promo': return 'text-green-400 bg-green-400/10 border-green-400/20';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-gradient-to-tr from-pidgey-accent to-pidgey-secondary rounded-lg text-pidgey-dark shadow-lg shadow-purple-900/50">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Pidgey Creations</h1>
                        <p className="text-xs text-pidgey-muted">Review, approve, or reject AI-generated drafts.</p>
                    </div>
                </div>
                <button 
                    onClick={() => openPidgey("I need you to draft a new campaign.")}
                    className="flex items-center gap-2 px-4 py-2 bg-pidgey-panel border border-pidgey-border text-pidgey-muted hover:text-white font-bold rounded-lg transition"
                >
                    <Bird size={18} /> Ask Pidgey for Drafts
                </button>
            </div>

            {creations.length === 0 ? (
                <div className="bg-pidgey-panel border border-dashed border-pidgey-border rounded-xl p-12 text-center flex flex-col items-center">
                    <Bird size={64} className="text-pidgey-muted opacity-20 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No Drafts Pending</h3>
                    <p className="text-pidgey-muted max-w-md mx-auto mb-6">
                        Pidgey hasn't created anything yet. Open the chat and ask him to "Draft a broadcast for Halloween" or "Create a new drop".
                    </p>
                    <button 
                        onClick={() => openPidgey()}
                        className="px-6 py-3 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition"
                    >
                        Wake Up Pidgey
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creations.map((draft) => (
                        <div key={draft.id} className="bg-pidgey-panel border border-pidgey-border rounded-xl overflow-hidden hover:border-pidgey-accent transition-colors shadow-lg animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-5 border-b border-pidgey-border bg-pidgey-dark/30 flex justify-between items-start">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getTypeColor(draft.type)}`}>
                                    {draft.type}
                                </div>
                                <div className="text-xs text-pidgey-muted flex items-center gap-1">
                                    <Clock size={12} /> {new Date(draft.created_at).toLocaleTimeString()}
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-2">{draft.summary}</h3>
                                <div className="bg-pidgey-dark rounded-lg p-3 text-xs font-mono text-pidgey-muted overflow-hidden border border-pidgey-border mb-6 max-h-40 overflow-y-auto">
                                    <pre>{JSON.stringify(draft.data, null, 2)}</pre>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleReject(draft.id)}
                                        className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 font-bold text-sm flex items-center justify-center gap-2 transition"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <button 
                                        onClick={() => handleApprove(draft)}
                                        className="flex-[2] py-2 bg-pidgey-accent text-pidgey-dark font-bold rounded-lg hover:bg-teal-300 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-teal-500/20"
                                    >
                                        <CheckCircle size={16} /> Approve & Publish
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
