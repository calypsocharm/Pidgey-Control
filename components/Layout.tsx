
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Egg, StickyNote, Mail, FolderOpen, Settings, LogOut, Search, Bell, Bird, Activity, Plane, Palette, Shield, ShieldAlert, Zap, Sparkles, Sun, Moon, Megaphone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { JarvisAgent } from './JarvisAgent';
import { useJarvis } from '../JarvisContext';
import { useAuth } from '../AuthContext';
import { useSafeMode } from '../SafeModeContext';
import { useTheme } from '../ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, badge }: { to: string; icon: any; label: string; badge?: number }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative group ${
        isActive
          ? 'bg-pidgey-accent/20 text-pidgey-accent font-bold shadow-lg shadow-pidgey-accent/5 backdrop-blur-sm'
          : 'text-pidgey-muted hover:text-pidgey-text hover:bg-white/5'
      }`}
    >
      <Icon size={20} className={isActive ? 'drop-shadow-md' : 'group-hover:scale-110 transition-transform'} />
      <span>{label}</span>
      {badge && badge > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-pidgey-accent text-pidgey-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              {badge}
          </span>
      )}
    </Link>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { openPidgey, isOpen, mood, creations } = useJarvis();
  const { logout } = useAuth();
  const { isSafeMode, toggleSafeMode } = useSafeMode();
  const { theme, toggleTheme } = useTheme();
  
  // Simulated System Pulse
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'error'>('healthy');
  const [lastLog, setLastLog] = useState('System operational');

  useEffect(() => {
    // Randomly generate "activity"
    const interval = setInterval(() => {
        const r = Math.random();
        if (r > 0.95) {
            setSystemHealth('error');
            setLastLog('⚠️ Webhook timeout: smtp2go-relay');
            setTimeout(() => setSystemHealth('healthy'), 4000);
        } else if (r > 0.7) {
            setLastLog('Info: Batch email job completed (140ms)');
        }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex h-screen overflow-hidden text-pidgey-text font-sans relative ${!isSafeMode ? 'border-[6px] border-red-500/30' : ''}`}>
      {/* Sidebar - Glassmorphism */}
      <aside className="w-72 flex-shrink-0 border-r border-pidgey-glass-border flex flex-col bg-pidgey-dark/40 backdrop-blur-xl z-20 shadow-2xl transition-colors duration-300">
        <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pidgey-accent to-pidgey-secondary flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="font-bold text-white text-xl">P</span>
            </div>
          <span className="text-xl font-bold tracking-tight text-pidgey-text drop-shadow-sm">Control Tower</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-bold text-pidgey-muted uppercase tracking-widest mb-2 mt-4 px-4 opacity-70">
            Control Center
          </div>
          <NavItem to="/" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/members" icon={Users} label="Members" />
          <NavItem to="/deliveries" icon={Activity} label="Message Health" />
          
          <div className="text-[10px] font-bold text-pidgey-muted uppercase tracking-widest mb-2 mt-6 px-4 opacity-70">
            Creative & Drops
          </div>
          <NavItem to="/drops" icon={Egg} label="Drops & Stamps" />
          <NavItem to="/playground" icon={Palette} label="Playground" />
          <NavItem to="/files" icon={FolderOpen} label="Files" />
          
          <div className="text-[10px] font-bold text-pidgey-muted uppercase tracking-widest mb-2 mt-6 px-4 opacity-70">
            Operations & Review
          </div>
          <NavItem to="/creations" icon={Sparkles} label="Pidgey Creations" badge={creations.length} />
          <NavItem to="/flight-path" icon={Plane} label="Flight Path" />
          <NavItem to="/broadcasts" icon={Megaphone} label="Broadcasts" />
          <NavItem to="/promos" icon={StickyNote} label="Promos" />
          
          <div className="text-[10px] font-bold text-pidgey-muted uppercase tracking-widest mb-2 mt-6 px-4 opacity-70">
            System & Support
          </div>
          <NavItem to="/support" icon={Mail} label="Support" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-6 border-t border-pidgey-glass-border">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-pidgey-muted hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-medium"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header - Glassmorphism */}
        <header className="h-20 border-b border-pidgey-glass-border bg-pidgey-dark/30 backdrop-blur-md flex items-center justify-between px-8 z-10 transition-colors duration-300">
          <div className="flex items-center w-96 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pidgey-muted group-hover:text-pidgey-accent transition-colors" size={18} />
            <input 
                type="text" 
                placeholder="Search profiles, tickets, or drops..." 
                className="w-full bg-pidgey-panel/50 border border-pidgey-border hover:border-pidgey-accent/30 rounded-full pl-11 pr-6 py-2.5 text-sm focus:outline-none focus:border-pidgey-accent/50 text-pidgey-text transition-all shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-pidgey-panel/50 border border-pidgey-border text-pidgey-muted hover:text-pidgey-accent hover:border-pidgey-accent/50 transition-all shadow-sm"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Safe Mode Toggle */}
            <div className="flex items-center gap-1 bg-pidgey-panel/50 rounded-full p-1 border border-pidgey-border shadow-sm">
                <button 
                    onClick={toggleSafeMode}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        isSafeMode 
                        ? 'bg-pidgey-accent text-pidgey-dark shadow-sm' 
                        : 'text-pidgey-muted hover:text-pidgey-text'
                    }`}
                >
                    <Shield size={14} /> SAFE
                </button>
                <button 
                    onClick={toggleSafeMode}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        !isSafeMode 
                        ? 'bg-red-500 text-white shadow-sm animate-pulse' 
                        : 'text-pidgey-muted hover:text-pidgey-text'
                    }`}
                >
                    <ShieldAlert size={14} /> GOD MODE
                </button>
            </div>

            <button className="relative p-2.5 text-pidgey-muted hover:text-pidgey-text rounded-full hover:bg-pidgey-panel/50 transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-pidgey-secondary rounded-full ring-2 ring-pidgey-dark"></span>
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pidgey-border to-pidgey-panel p-0.5 cursor-pointer hover:scale-105 transition-transform shadow-md">
                <img src="https://picsum.photos/seed/admin/100" alt="Admin" className="rounded-full border-2 border-pidgey-dark w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 pb-16 scrollbar-thin">
          {children}
        </main>
        
        {/* System Pulse Footer - Floating Glass */}
        <div className="absolute bottom-4 left-8 right-8 h-10 bg-pidgey-dark/80 backdrop-blur-md border border-pidgey-glass-border rounded-full flex items-center px-6 justify-between text-[10px] uppercase font-bold tracking-wider z-20 shadow-lg">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${systemHealth === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-ping'}`}></div>
                <span className={systemHealth === 'healthy' ? 'text-pidgey-muted' : 'text-red-400'}>
                    {lastLog}
                </span>
            </div>
            <div className="flex items-center gap-4 text-pidgey-muted">
                <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> 14ms latency</span>
                <span>v4.0.0-Dreamy</span>
            </div>
        </div>

        {/* Floating Pidgey Bubble */}
        <button 
            onClick={() => openPidgey()}
            className={`absolute bottom-20 right-8 w-16 h-16 rounded-3xl shadow-2xl shadow-purple-900/40 flex items-center justify-center text-pidgey-dark hover:scale-110 transition-all z-40 group ${
                isOpen ? 'hidden' : 'flex'
            } ${
                mood === 'thinking' ? 'bg-purple-300 animate-pulse' : 
                mood === 'happy' ? 'bg-gradient-to-tr from-pidgey-accent to-teal-200 animate-bounce' : 
                'bg-gradient-to-tr from-pidgey-accent to-pidgey-secondary'
            }`}
        >
            <Bird size={32} className={`transition-transform ${mood === 'idle' ? 'group-hover:rotate-12' : ''}`} />
            {/* Status Dot */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-4 border-pidgey-dark flex items-center justify-center">
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </span>
        </button>
      </div>

      {/* Pidgey Drawer */}
      <JarvisAgent />
    </div>
  );
};
