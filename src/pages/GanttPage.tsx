import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScheduleOperation, Machine, Schedule } from '../types';
import { getApiErrorMessage } from '../utils/errorParser';
import { GanttChart } from '../components/GanttChart';
import { 
  BarChart3, 
  RefreshCw, 
  Sparkles, 
  Download, 
  Layers, 
  Clock, 
  Cpu, 
  RotateCcw, 
  Database, 
  PlusCircle, 
  PlayCircle, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

interface GanttPageProps {
  onOpenWhatIf: () => void;
}

export const GanttPage: React.FC<GanttPageProps> = ({ onOpenWhatIf }) => {
  const [scheduleOperations, setScheduleOperations] = useState<ScheduleOperation[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  const loadGanttData = async (showNotice = false) => {
    setLoading(true);
    try {
      const [ganttRes, mList, activeSch] = await Promise.all([
        api.getGanttSchedule().catch(() => null),
        api.getMachines().catch(() => []),
        api.getActiveSchedule().catch(async () => {
          const history = await api.getScheduleHistory().catch(() => []);
          return history && history.length > 0 ? history[history.length - 1] : null;
        }),
      ]);

      let validMachines = (ganttRes?.data?.machines || ganttRes?.machines || mList) || [];
      let validSchedule = ganttRes?.data?.schedule || ganttRes?.schedule || activeSch || null;
      let ops = ganttRes?.data?.schedule_operations || ganttRes?.data?.operations || ganttRes?.schedule_operations || ganttRes?.operations || validSchedule?.schedule_operations || [];

      // Auto-populate if demo mode and completely empty
      const isDemo = localStorage.getItem('qfb_factory_mode') !== 'custom';
      if (isDemo && (validMachines.length === 0 || !validSchedule || ops.length === 0)) {
        try {
          await api.loadDemoFactory();
          const refreshedGantt = await api.getGanttSchedule().catch(() => null);
          if (refreshedGantt) {
            validMachines = refreshedGantt.data?.machines || refreshedGantt.machines || [];
            validSchedule = refreshedGantt.data?.schedule || refreshedGantt.schedule || null;
            ops = refreshedGantt.data?.schedule_operations || refreshedGantt.data?.operations || validSchedule?.schedule_operations || [];
          }
        } catch {
          // ignore error in auto-seed
        }
      }

      setMachines(validMachines);
      setSchedule(validSchedule);
      setScheduleOperations(ops);

      if (showNotice) {
        setActionNotice({
          type: 'success',
          text: `Gantt loaded ${validMachines.length} machines and ${ops.length} scheduled operations.`
        });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: 'Failed to load Gantt operations: ' + getApiErrorMessage(err)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoFactory = async () => {
    setSeeding(true);
    try {
      await api.loadDemoFactory();
      await loadGanttData();
      setActionNotice({
        type: 'success',
        text: 'Demo factory dataset loaded successfully with 6 machines, benchmark jobs, and active quantum schedule!'
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: 'Failed to seed demo factory: ' + getApiErrorMessage(err)
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleLoadDemoSchedule = async () => {
    setSeeding(true);
    try {
      const generated = await api.seedSchedule();
      setSchedule(generated);
      setScheduleOperations(generated.schedule_operations || []);
      const mList = await api.getMachines().catch(() => []);
      setMachines(mList || []);
      setActionNotice({
        type: 'success',
        text: `Demo schedule ${generated.version} loaded successfully (${generated.schedule_operations?.length || 0} operations, Makespan: ${generated.makespan}h).`
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: 'Failed to generate schedule: ' + getApiErrorMessage(err)
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleUndoSchedule = async () => {
    try {
      const reverted = await api.undoSchedule();
      setSchedule(reverted);
      setScheduleOperations(reverted.schedule_operations || []);
      setActionNotice({
        type: 'warning',
        text: `Undo successful! Reverted to schedule version ${reverted.version} (Makespan: ${reverted.makespan}h, Utilization: ${reverted.utilization}%).`
      });
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: getApiErrorMessage(err) || 'Cannot undo: Already at baseline schedule version.'
      });
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleOperationMove = async (
    opId: number, 
    targetMachineId: number, 
    targetStartTime: number
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.updateScheduleOperation({
        id: opId,
        target_machine_id: targetMachineId,
        target_start_time: targetStartTime,
      });

      if (response && response.schedule) {
        setSchedule(response.schedule);
        setScheduleOperations(response.schedule.schedule_operations || []);
        return {
          success: true,
          message: `Operation reallocated to machine at ${targetStartTime}h. Makespan is now ${response.schedule.makespan}h.`,
        };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: getApiErrorMessage(err) || 'Validation rejected by scheduling engine.',
      };
    }
  };

  useEffect(() => {
    loadGanttData();
  }, []);

  const isScheduleEmpty = !loading && (scheduleOperations.length === 0 || machines.length === 0);

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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            id="gantt-undo-schedule-btn"
            onClick={handleUndoSchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-all shadow-sm"
            title="Undo / Revert to previous schedule version"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Schedule</span>
          </button>

          <button
            id="btn-simulate-disruption"
            onClick={onOpenWhatIf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-600/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Disruption</span>
          </button>

          <a
            href={api.getExportScheduleUrl()}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => loadGanttData(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between border transition-all animate-fadeIn ${
          actionNotice.type === 'error'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            : actionNotice.type === 'warning'
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : actionNotice.type === 'warning' ? (
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)} 
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Schedule Meta Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0e172b] border border-slate-800 rounded-xl p-4 text-xs">
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Schedule Identifier</span>
          <span className="font-mono font-bold text-cyan-400 text-sm">{schedule?.version || 'SCH-BASELINE'}</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Target Makespan</span>
          <span className="font-mono font-bold text-white text-sm">{schedule?.makespan ?? 38.5} Hours</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Average Utilization</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">{schedule?.utilization ?? 87.4}%</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-semibold text-[10px]">Delayed Orders Risk</span>
          <span className="font-mono font-bold text-amber-400 text-sm">{schedule?.delayed_jobs ?? 0} Orders</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-16 text-center text-slate-400 bg-[#0e172b] border border-slate-800 rounded-xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
          <p className="text-xs">Building interactive Gantt floor allocation grid...</p>
        </div>
      )}

      {/* Empty State Recovery Card */}
      {!loading && isScheduleEmpty && (
        <div className="bg-[#0e172b] border border-cyan-500/30 rounded-2xl p-10 text-center max-w-2xl mx-auto shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">No active schedule available</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              No active schedule available. Load demo factory data or create jobs to generate a schedule.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="btn-load-demo-factory"
              disabled={seeding}
              onClick={handleLoadDemoFactory}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>{seeding ? 'Populating Factory...' : 'Load Demo Factory'}</span>
            </button>

            <button
              id="btn-load-demo-schedule"
              disabled={seeding}
              onClick={handleLoadDemoSchedule}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{seeding ? 'Generating Plan...' : 'Load Demo Schedule'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Gantt Chart Container */}
      {!loading && (
        <GanttChart
          scheduleOperations={scheduleOperations}
          machines={machines}
          makespan={schedule?.makespan || 40.0}
          onOperationMove={handleOperationMove}
          onLoadDemoFactory={handleLoadDemoFactory}
          onScheduleUpdated={(newSch) => {
            setSchedule(newSch);
            setScheduleOperations(newSch.schedule_operations || []);
          }}
        />
      )}
    </div>
  );
};
