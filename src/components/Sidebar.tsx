import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Layers, 
  CalendarClock, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  Bell, 
  FileSpreadsheet, 
  History, 
  Settings, 
  ShieldAlert,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenHackathonGuide?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onNavigate, 
  onOpenHackathonGuide,
  collapsed,
  onToggleCollapse 
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Core Operations' },
    { id: 'machines', label: 'Machines & Floor', icon: Cpu, category: 'Core Operations' },
    { id: 'jobs', label: 'Jobs & Operations', icon: Layers, category: 'Core Operations' },
    { id: 'scheduling', label: 'Dynamic Scheduler', icon: CalendarClock, category: 'Quantum Engine', badge: 'AI/QUBO' },
    { id: 'gantt', label: 'Factory Gantt Timeline', icon: BarChart3, category: 'Quantum Engine' },
    { id: 'optimization', label: 'QUBO & Benchmarks', icon: Zap, category: 'Quantum Engine' },
    { id: 'analytics', label: 'Bottlenecks & Analytics', icon: TrendingUp, category: 'Intelligence' },
    { id: 'alerts', label: 'Live Floor Alerts', icon: Bell, category: 'Intelligence' },
    { id: 'reports', label: 'Reports & CSV Export', icon: FileSpreadsheet, category: 'Management' },
    { id: 'history', label: 'Schedule Version History', icon: History, category: 'Management' },
    { id: 'settings', label: 'Settings & XAMPP Spec', icon: Settings, category: 'Management' },
  ];

  // Group items by category
  const categories = ['Core Operations', 'Quantum Engine', 'Intelligence', 'Management'];

  return (
    <aside className="w-64 bg-[#0d1527] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            Quantum Factory
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              BRAIN
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">Dynamic DFJSSP Engine</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs font-medium">
        {categories.map((cat) => (
          <div key={cat} className="space-y-1">
            <div className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-300">
              {cat}
            </div>
            {navItems
              .filter((item) => item.category === cat)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}

        {/* Presentation Walkthrough Button */}
        <div className="pt-2">
          <button
            id="btn-hackathon-walkthrough"
            onClick={onOpenHackathonGuide}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all font-semibold shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>8-Step Demo Tour</span>
          </button>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#090f1d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 border border-slate-600">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Manager'}</div>
              <div className="text-[10px] text-cyan-400 font-mono uppercase">{user?.role || 'Manager'}</div>
            </div>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" title="Connected to Optimization Engine" />
        </div>
      </div>
    </aside>
  );
};
