
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { 
  Users, DollarSign, Activity, Egg, Bird
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer
} from 'recharts';

import { Layout } from './components/Layout';
import { Members } from './components/Members';
import { Drops } from './components/Drops';
import { Support } from './components/Support';
import { Broadcasts } from './components/Broadcasts';
import { Promos } from './components/Promos';
import { Files } from './components/Files';
import { Settings } from './components/Settings';
import { Deliveries } from './components/Deliveries';
import { FlightPath } from './components/FlightPath';
import { Playground } from './components/Playground';
import { PidgeyCreations } from './components/PidgeyCreations';
import { LoginScreen } from './components/LoginScreen';

import { JarvisProvider, useJarvis } from './JarvisContext';
import { AuthProvider, useAuth } from './AuthContext';
import { SafeModeProvider } from './SafeModeContext';
import { ThemeProvider } from './ThemeContext';
import { AdminService } from './services/adminService';

// --- Dashboard Component ---
const Dashboard = () => {
  const { openPidgey } = useJarvis();
  const [stats, setStats] = useState({
      members: 0,
      revenue: 0,
      eggs: 0,
      tickets: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRealData = async () => {
        setLoading(true);
        // 1. Get Top Level Stats
        const data = await AdminService.dashboard.getStats();
        setStats({
            members: data.members,
            revenue: data.revenue,
            tickets: data.tickets,
            eggs: 0 // We don't have an eggs_hatched table yet, so keeping 0 or mock
        });
        setActivity(data.activity);

        // 2. Get Chart Data
        const chart = await AdminService.dashboard.getRevenueChart();
        setChartData(chart);
        
        setLoading(false);
    };
    fetchRealData();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Control Tower Overview</h1>
        <button 
            onClick={() => openPidgey("Analyze system health and show me Today's Love List.")}
            className="flex items-center gap-2 px-4 py-2 bg-pidgey-accent/10 border border-pidgey-accent/30 text-pidgey-accent rounded-lg text-sm hover:bg-pidgey-accent/20 transition font-medium"
        >
            <Bird size={16} />
            <span>Ask Pidgey: Triage Today</span>
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Active Members', value: stats.members.toLocaleString(), icon: Users, color: 'text-blue-400' },
          { label: 'Eggs Hatched', value: '42,000+', icon: Egg, color: 'text-yellow-400' }, // Hardcoded estimate until table exists
          { label: 'Pending Tickets', value: stats.tickets, icon: Activity, color: 'text-red-400' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-pidgey-panel border border-pidgey-border p-6 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-pidgey-muted text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 text-pidgey-text">{loading ? '...' : stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-pidgey-dark ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-pidgey-panel border border-pidgey-border rounded-xl p-6 relative shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold">Revenue Trends (7 Days)</h3>
             <button onClick={() => openPidgey("Explain the revenue trend for this week. Why was Friday low?")} className="text-xs text-pidgey-muted hover:text-pidgey-accent flex items-center gap-1">
                <Bird size={12} /> Explain Trend
             </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length > 0 ? chartData : [{name: 'Loading', revenue: 0}]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <ReTooltip 
                    contentStyle={{ backgroundColor: 'var(--pidgey-panel)', borderColor: 'var(--pidgey-border)', color: 'var(--pidgey-text)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--pidgey-text)' }}
                />
                <Bar dataKey="revenue" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="eggs" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-pidgey-panel border border-pidgey-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Real-Time Activity</h3>
            {activity.length === 0 ? (
                <p className="text-pidgey-muted text-sm text-center py-4">No recent activity logs found.</p>
            ) : (
                <div className="space-y-4">
                    {activity.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 border-b border-pidgey-border last:border-0 pb-3 last:pb-0">
                            <div className="w-2 h-2 rounded-full bg-pidgey-accent mt-2 flex-shrink-0" />
                            <div>
                                <p className="text-sm">
                                    <span className="text-pidgey-accent font-bold">@{log.profiles?.full_name || 'User'}</span> {log.description}
                                </p>
                                <p className="text-xs text-pidgey-muted mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- App Content Wrapper ---
const AppContent = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return (
        <SafeModeProvider>
            <JarvisProvider>
              <HashRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/drops" element={<Drops />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/broadcasts" element={<Broadcasts />} />
                    <Route path="/deliveries" element={<Deliveries />} />
                    <Route path="/flight-path" element={<FlightPath />} />
                    <Route path="/creations" element={<PidgeyCreations />} />
                    <Route path="/promos" element={<Promos />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/playground" element={<Playground />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={
                      <div className="flex flex-col items-center justify-center h-full text-pidgey-muted">
                          <div className="text-6xl mb-4">🚧</div>
                          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
                          <Link to="/" className="mt-6 px-4 py-2 bg-pidgey-panel border border-pidgey-border rounded hover:bg-pidgey-border">Go Home</Link>
                      </div>
                    } />
                  </Routes>
                </Layout>
              </HashRouter>
            </JarvisProvider>
        </SafeModeProvider>
    );
};

// --- App Root Component ---
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
          <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
