import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Egg, StickyNote, Mail, FolderOpen, Settings, LogOut, Search, Bell, Bird, Activity, Plane, Palette, Shield, ShieldAlert, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { JarvisAgent } from './JarvisAgent';
import { useJarvis } from '../JarvisContext';
import { useAuth } from '../AuthContext';
import { useSafeMode } from '../SafeModeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-pidgey-accent/20 text-pidgey-accent font-medium'
          : 'text-pidgey-muted hover:text-pidgey-text hover:bg-pidgey-panel'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { openPidgey, isOpen, mood } = useJarvis();
  const { logout } = useAuth();
  const { isSafeMode, toggleSafeMode } = useSafeMode();
  
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
    <div className={`flex h-screen bg-pidgey-dark overflow-hidden text-pidgey-text font-sans relative ${!isSafeMode ? 'border-4 border-red-500/20' : ''}`}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-pidgey-border flex flex-col bg-pidgey-dark z-20">
        <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pidgey-accent to-pidgey-secondary flex items-center justify-center">
                <span className="font-bold text-white text-lg">P</span>
            </div>
          <span className="text-xl font-bold tracking-tight">Control Tower</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-pidgey-muted uppercase tracking-wider mb-2 mt-4 px-4">
            Main
          </div>
          <NavItem to="/" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/members" icon={Users} label="Members" />
          <NavItem to="/drops" icon={Egg} label="Drops & Stamps" />
          <NavItem to="/playground" icon={Palette} label="Playground" />
          
          <div className="text-xs font-semibold text-pidgey-muted uppercase tracking-wider mb-2 mt-6 px-4">
            Operations
          </div>
          <NavItem to="/flight-path" icon={Plane} label="Flight Path" />
          <NavItem to="/support" icon={Mail} label="Support" />
          <NavItem to="/broadcasts" icon={Bell} label="Broadcasts" />
          <NavItem to="/deliveries" icon={Activity} label="Message Health" />
          <NavItem to="/promos" icon={StickyNote} label="Promos" />
          
          <div className="text-xs font-semibold text-pidgey-muted uppercase tracking-wider mb-2 mt-6 px-4">
            System
          </div>
          <NavItem to="/files" icon={FolderOpen} label="Files" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-pidgey-border">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-pidgey-muted hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-pidgey-border bg-pidgey-dark/95 backdrop-blur flex items-center justify-between px-8 z-10">
          <div className="flex items-center w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pidgey-muted" size={18} />
            <input 
                type="text" 
                placeholder="Search profiles, tickets, or drops..." 
                className="w-full bg-pidgey-panel border border-pidgey-border rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-pidgey-accent text-pidgey-text"
            />
          </div>
          
          <div className="flex items-center gap-6">
            {/* Safe Mode Toggle */}
            <div className="flex items-center gap-3 bg-pidgey-panel rounded-full p-1 border border-pidgey-border">
                <button 
                    onClick={toggleSafeMode}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        isSafeMode 
                        ? 'bg-pidgey-accent text-pidgey-dark shadow-sm' 
                        : 'text-pidgey-muted hover:text-white'
                    }`}
                >
                    <Shield size={14} /> SAFE
                </button>
                <button 
                    onClick={toggleSafeMode}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        !isSafeMode 
                        ? 'bg-red-500 text-white shadow-sm animate-pulse' 
                        : 'text-pidgey-muted hover:text-white'
                    }`}
                >
                    <ShieldAlert size={14} /> GOD MODE
                </button>
            </div>

            <button className="relative p-2 text-pidgey-muted hover:text-pidgey-text rounded-full hover:bg-pidgey-panel">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pidgey-secondary rounded-full"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-pidgey-border overflow-hidden">
                <img src="https://picsum.photos/seed/admin/100" alt="Admin" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 pb-12">
          {children}
        </main>
        
        {/* System Pulse Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-pidgey-dark border-t border-pidgey-border flex items-center px-4 justify-between text-[10px] uppercase font-bold tracking-wider z-20">
            <div className="flex items-center gap-2">
                <Activity size={12} className={systemHealth === 'healthy' ? 'text-green-500' : 'text-red-500 animate-bounce'} />
                <span className={systemHealth === 'healthy' ? 'text-pidgey-muted' : 'text-red-400'}>
                    {lastLog}
                </span>
            </div>
            <div className="flex items-center gap-4 text-pidgey-muted">
                <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-400" /> 14ms latency</span>
                <span>v1.2.0-rc4</span>
            </div>
        </div>

        {/* Floating Pidgey Bubble */}
        <button 
            onClick={() => openPidgey()}
            className={`absolute bottom-12 right-8 w-16 h-16 rounded-full shadow-lg shadow-purple-900/50 flex items-center justify-center text-pidgey-dark hover:scale-105 transition-all z-40 group ${
                isOpen ? 'hidden' : 'flex'
            } ${
                mood === 'thinking' ? 'bg-purple-400 animate-pulse' : 
                mood === 'happy' ? 'bg-pidgey-accent animate-bounce' : 
                'bg-gradient-to-tr from-pidgey-accent to-pidgey-secondary'
            }`}
        >
            <Bird size={32} className={`transition-transform ${mood === 'idle' ? 'group-hover:rotate-12' : ''}`} />
            {/* Status Dot */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-pidgey-dark flex items-center justify-center">
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </span>
        </button>
      </div>

      {/* Pidgey Drawer */}
      <JarvisAgent />
    </div>
  );
};