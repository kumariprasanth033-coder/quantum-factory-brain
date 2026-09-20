import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScheduleOperation, Machine, Schedule } from '../types';
import { GanttChart } from '../components/GanttChart';
import { BarChart3, RefreshCw, Sparkles, Download, Layers, Clock, Cpu } from 'lucide-react';

interface GanttPageProps {
  onOpenWhatIf: () => void;
}

export const GanttPage: React.FC<GanttPageProps> = ({ onOpenWhatIf }) => {
  const [scheduleOperations, setScheduleOperations] = useState<ScheduleOperation[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadGanttData = async () => {
    setLoading(true);
    try {
      const [mList, history] = await Promise.all([
        api.getMachines(),
        api.getScheduleHistory(),
      ]);
      setMachines(mList || []);
      if (history && history.length > 0) {
        const latest = history[history.length - 1];
        setSchedule(latest);
        setScheduleOperations(latest.schedule_operations || []);
      }
    } catch (err: any) {
      alert('Failed to load Gantt operations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGanttData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Interactive Factory Gantt Schedule
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing multi-machine operation allocations, chronological precedence, and delivery windows.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenWhatIf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Disruption</span>
          </button>

          <a
            href={api.getExportScheduleUrl()}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={loadGanttData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Schedule Meta Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0e172b] border border-slate-800 rounded-xl p-4 text-xs">
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Schedule Identifier</span>
          <span className="font-mono font-bold text-cyan-400 text-sm">{schedule?.version || 'SCH-2026-LIVE'}</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Target Makespan</span>
          <span className="font-mono font-bold text-white text-sm">{schedule?.makespan || 38.5} Hours</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Average Utilization</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">{schedule?.utilization || 87.4}%</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Delayed Orders Risk</span>
          <span className="font-mono font-bold text-amber-400 text-sm">{schedule?.delayed_jobs || 2} Orders</span>
        </div>
      </div>

      {/* Gantt Chart Container */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
          <p className="text-xs">Building interactive Gantt grid...</p>
        </div>
      ) : (
        <GanttChart
          scheduleOperations={scheduleOperations}
          machines={machines}
          makespan={schedule?.makespan || 40.0}
        />
      )}
    </div>
  );
};
