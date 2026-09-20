import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  Cpu, 
  LogOut, 
  UserCheck, 
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AlertItem } from '../types';

interface NavbarProps {
  onOpenWhatIf: () => void;
  onOpenTour?: () => void;
  onRefreshAll?: () => void;
  onResetDemo?: () => void;
  onNavigateToAlerts: () => void;
  unreadAlertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenWhatIf, 
  onOpenTour, 
  onRefreshAll, 
  onResetDemo, 
  onNavigateToAlerts,
  unreadAlertsCount 
}) => {
  const { user, logout, demoLogin } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [time, setTime] = useState<string>('');

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadAlerts = alerts.filter(a => !a.is_read);

  const handleSeedDemo = async () => {
    if (onResetDemo) {
      onResetDemo();
      return;
    }
    setIsSeeding(true);
    try {
      await api.loadDemoFactory();
      if (onRefreshAll) onRefreshAll();
      await fetchAlerts();
    } catch (err: any) {
      alert('Error loading demo factory: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-[#0e1628] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Plant & Shift Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>FACTORY TIME:</span>
          <span className="text-white font-bold">{time || '09:00:00 AM'}</span>
          <span className="text-emerald-400 font-semibold ml-1">SHIFT A</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/50 border border-slate-700/60 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-200">ENGINE:</span>
            <span className="text-cyan-300 font-bold">DFJSSP-QUBO READY</span>
          </span>
          <span className="text-slate-300 text-xs font-medium">Amaravati Quantum Innovation Track</span>
        </div>
      </div>

      {/* Right: Actions, Alerts, Profile */}
      <div className="flex items-center gap-3">
        {/* Judge Demo Tour Button */}
        {onOpenTour && (
          <button
            id="btn-nav-tour"
            onClick={onOpenTour}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all shadow-sm shadow-cyan-950/40"
            title="8-Step Guided Tour for Hackathon Judges & Evaluators"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>Judge Demo Tour</span>
          </button>
        )}

        {/* Load Demo Factory Button */}
        <button
          id="btn-load-demo-factory"
          onClick={handleSeedDemo}
          disabled={isSeeding}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
          title="Reset database to realistic 6 machines and 20 multi-operation jobs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Populating...' : 'Reset Demo'}</span>
        </button>

        {/* What-If Simulation Trigger */}
        <button
          id="btn-what-if-nav"
          onClick={onOpenWhatIf}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-sm shadow-purple-900/30 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
          <span>What-If Simulator</span>
        </button>

        {/* Alert Bell Dropdown */}
        <div className="relative">
          <button
            id="btn-nav-alerts-bell"
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {(unreadAlertsCount !== undefined ? unreadAlertsCount : unreadAlerts.length) > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0e1628]">
                {unreadAlertsCount !== undefined ? unreadAlertsCount : unreadAlerts.length}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[#121c33] border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-white">Live Floor Notifications</span>
                <button
                  onClick={() => {
                    api.markAlertRead();
                    setShowAlertMenu(false);
                    fetchAlerts();
                  }}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/80">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No factory alerts reported</div>
                ) : (
                  alerts.slice(0, 5).map((a) => (
                    <div key={a.id} className={`p-3 transition-colors ${a.is_read ? 'opacity-70' : 'bg-slate-800/30'}`}>
                      <div className="flex items-start gap-2">
                        {a.severity === 'danger' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-medium text-slate-200">{a.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{a.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-800 text-center bg-slate-900/50">
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    onNavigateToAlerts();
                  }}
                  className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300"
                >
                  View all alerts & history &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px] font-medium">
            <button
              onClick={() => demoLogin('manager')}
              className={`px-2 py-1 rounded transition-colors ${
                user?.role === 'manager' ? 'bg-cyan-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Manager (full access)"
            >
              Manager
            </button>
            <button
              onClick={() => demoLogin('operator')}
              className={`px-2 py-1 rounded transition-colors ${
                user?.role === 'operator' ? 'bg-cyan-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Operator role"
            >
              Operator
            </button>
            <button
              onClick={() => demoLogin('admin')}
              className={`px-2 py-1 rounded transition-colors ${
                user?.role === 'admin' ? 'bg-cyan-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Admin role"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
