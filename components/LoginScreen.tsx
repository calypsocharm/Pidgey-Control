
import React, { useState } from 'react';
import { Bird, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(password)) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-pidgey-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pidgey-accent/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pidgey-secondary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-pidgey-panel border border-pidgey-border rounded-2xl p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-pidgey-accent to-pidgey-secondary rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-900/50">
                <Bird size={40} className="text-pidgey-dark" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pidgey Control Tower</h1>
            <p className="text-pidgey-muted text-sm mt-2">Restricted Admin Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-pidgey-muted uppercase mb-2 ml-1">Access Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={18} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(false); }}
                        className={`w-full bg-pidgey-dark border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-pidgey-border focus:border-pidgey-accent'} rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none transition-all`}
                        placeholder="Enter admin key..."
                        autoFocus
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-2 mt-3 text-red-400 text-xs font-bold animate-in slide-in-from-top-1">
                        <AlertCircle size={14} />
                        <span>Incorrect password. Please try again.</span>
                    </div>
                )}
            </div>

            <button 
                type="submit"
                className="w-full py-3.5 bg-pidgey-accent text-pidgey-dark font-bold rounded-xl hover:bg-teal-300 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-teal-400/20 hover:scale-[1.02] active:scale-[0.98]"
            >
                Login to Console <ArrowRight size={18} />
            </button>
        </form>
        
        <div className="mt-10 pt-6 border-t border-pidgey-border text-center">
            <p className="text-[10px] text-pidgey-muted uppercase tracking-widest font-semibold opacity-60">
                Secured Environment v1.0
            </p>
        </div>
      </div>
    </div>
  );
};
