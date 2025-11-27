import React from 'react';
import { LayoutDashboard, Users, Egg, StickyNote, Mail, FolderOpen, Settings, LogOut, Search, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

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
  return (
    <div className="flex h-screen bg-pidgey-dark overflow-hidden text-pidgey-text font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-pidgey-border flex flex-col bg-pidgey-dark">
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
          
          <div className="text-xs font-semibold text-pidgey-muted uppercase tracking-wider mb-2 mt-6 px-4">
            Operations
          </div>
          <NavItem to="/support" icon={Mail} label="Support" />
          <NavItem to="/broadcasts" icon={Bell} label="Broadcasts" />
          <NavItem to="/promos" icon={StickyNote} label="Promos" />
          
          <div className="text-xs font-semibold text-pidgey-muted uppercase tracking-wider mb-2 mt-6 px-4">
            System
          </div>
          <NavItem to="/files" icon={FolderOpen} label="Files" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-pidgey-border">
          <button className="flex items-center gap-3 px-4 py-2 w-full text-pidgey-muted hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
          
          <div className="flex items-center gap-4">
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
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
