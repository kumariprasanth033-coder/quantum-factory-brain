import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Layers, 
  Cpu, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RotateCcw
} from 'lucide-react';
import { FactoryMode } from '../types';

interface NavigationBreadcrumbBarProps {
  currentPage: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  factoryMode: FactoryMode;
  onToggleFactoryMode: () => void;
  onNavigate: (page: string) => void;
  onOpenWhatIf: () => void;
  onUndoSchedule?: () => void;
}

const pageTitles: Record<string, { title: string; category: string }> = {
  dashboard: { title: 'Executive Overview', category: 'Core Operations' },
  machines: { title: 'Machine Fleet & Floor Status', category: 'Core Operations' },
  jobs: { title: 'Work Orders & Operations', category: 'Core Operations' },
  'job-details': { title: 'Job Operation Detail & Precedence', category: 'Core Operations' },
  scheduling: { title: 'Dynamic DFJSSP Solver', category: 'Quantum Engine' },
  gantt: { title: 'Floor Gantt Timeline', category: 'Quantum Engine' },
  optimization: { title: 'QUBO Energy & Benchmarks', category: 'Quantum Engine' },
  analytics: { title: 'Machine Utilization & Bottlenecks', category: 'Intelligence' },
  alerts: { title: 'Real-Time Floor Alerts', category: 'Intelligence' },
  reports: { title: 'Reports & CSV Exports', category: 'Management' },
  history: { title: 'Schedule Version History', category: 'Management' },
  settings: { title: 'Factory Profile & API Config', category: 'Management' },
  'system-health': { title: 'Automated Functionality Tests', category: 'Diagnostics' },
  login: { title: 'Operator Access Portal', category: 'Authentication' },
};

export const NavigationBreadcrumbBar: React.FC<NavigationBreadcrumbBarProps> = ({
  currentPage,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  factoryMode,
  onToggleFactoryMode,
  onNavigate,
  onOpenWhatIf,
  onUndoSchedule,
}) => {
  const currentMeta = pageTitles[currentPage] || { title: 'Factory Floor', category: 'Operations' };

  return (
    <div className="bg-[#0b1222] border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Previous / Next buttons & Breadcrumb trail */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 shadow-inner">
          <button
            id="nav-btn-prev"
            onClick={onGoBack}
            disabled={!canGoBack}
            className={`p-1.5 rounded transition-colors flex items-center gap-1.5 ${
              canGoBack
                ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer font-semibold'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Go Back (Previous Page)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[11px] font-bold">Previous</span>
          </button>

          <span className="w-px h-3.5 bg-slate-800" />

          <button
            id="nav-btn-next"
            onClick={onGoForward}
            disabled={!canGoForward}
            className={`p-1.5 rounded transition-colors flex items-center gap-1.5 ${
              canGoForward
                ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer font-semibold'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Go Forward"
          >
            <span className="text-[11px] font-bold">Forward</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Global Undo Schedule Button */}
        {onUndoSchedule && (
          <button
            id="nav-btn-undo"
            onClick={onUndoSchedule}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all font-semibold shadow-sm text-[11px]"
            title="Undo / Revert Floor to Previous Schedule Version"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Undo Schedule</span>
          </button>
        )}

        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span className="text-slate-500">Floor</span>
          <span>/</span>
          <span className="text-slate-400">{currentMeta.category}</span>
          <span>/</span>
          <span className="text-cyan-300 font-bold tracking-tight">{currentMeta.title}</span>
        </div>
      </div>

      {/* Right: Mode Switcher & Quick Navigation Actions */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Active Mode Indicator & Switcher */}
        <div 
          onClick={onToggleFactoryMode}
          className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 transition-all shadow-sm"
          title="Click to switch between Demo Factory and My Factory"
        >
          <Building2 className={`w-3.5 h-3.5 ${factoryMode === 'demo' ? 'text-amber-400' : 'text-cyan-400'}`} />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Mode:</span>
            <span className={`text-[11px] font-bold ${factoryMode === 'demo' ? 'text-amber-300' : 'text-cyan-300'}`}>
              {factoryMode === 'demo' ? 'Demo Factory' : 'My Factory'}
            </span>
          </div>
          {factoryMode === 'demo' ? (
            <ToggleLeft className="w-4 h-4 text-amber-400 ml-1 group-hover:scale-110 transition-transform" />
          ) : (
            <ToggleRight className="w-4 h-4 text-cyan-400 ml-1 group-hover:scale-110 transition-transform" />
          )}
        </div>

        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            id="nav-quick-add-job"
            onClick={() => onNavigate('jobs')}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5 text-[11px] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Job</span>
          </button>

          <button
            id="nav-quick-add-machine"
            onClick={() => onNavigate('machines')}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5 text-[11px] transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Machine</span>
          </button>

          <button
            id="nav-quick-whatif"
            onClick={onOpenWhatIf}
            className="px-2.5 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 hover:text-white flex items-center gap-1.5 text-[11px] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Re-Optimize</span>
          </button>

          <button
            id="nav-quick-health"
            onClick={() => onNavigate('system-health')}
            className="px-2.5 py-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 hover:text-white flex items-center gap-1.5 text-[11px] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Health & Tests</span>
          </button>
        </div>
      </div>
    </div>
  );
};
