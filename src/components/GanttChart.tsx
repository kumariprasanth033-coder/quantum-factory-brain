import React, { useState, useMemo, useRef } from 'react';
import { ScheduleOperation, Machine, Schedule } from '../types';
import { api } from '../services/api';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Search, 
  X, 
  AlertTriangle, 
  Move,
  Clock,
  Layers,
  Check,
  Database,
  RefreshCw,
  PlayCircle
} from 'lucide-react';

export interface GanttChartProps {
  scheduleOperations: ScheduleOperation[];
  machines: Machine[];
  makespan?: number;
  onOperationMove?: (opId: number, targetMachineId: number, targetStartTime: number) => Promise<{ success: boolean; message?: string }>;
  onScheduleUpdated?: (newSchedule: Schedule) => void;
  onLoadDemoFactory?: () => Promise<void> | void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  scheduleOperations = [],
  machines = [],
  makespan = 40.0,
  onOperationMove,
  onScheduleUpdated,
  onLoadDemoFactory,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(26); // pixels per hour
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  
  // Drag and drop state
  const [draggingOp, setDraggingOp] = useState<ScheduleOperation | null>(null);
  const [dragTargetMachineId, setDragTargetMachineId] = useState<number | null>(null);
  const [dragTargetStartTime, setDragTargetStartTime] = useState<number | null>(null);
  const [isEligibleHover, setIsEligibleHover] = useState<boolean>(true);
  
  // Validation / Rejection alert banner
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'error' | 'success' | 'warning';
    message: string;
  } | null>(null);

  // Hover state
  const [hoveredOp, setHoveredOp] = useState<ScheduleOperation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Manual reallocation modal state
  const [selectedOpForEdit, setSelectedOpForEdit] = useState<ScheduleOperation | null>(null);
  const [modalTargetMachineId, setModalTargetMachineId] = useState<number>(1);
  const [modalTargetStartTime, setModalTargetStartTime] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Job unique list for filter dropdown
  const uniqueJobs = useMemo(() => {
    const map = new Map<number, { id: number; num: string; name: string }>();
    scheduleOperations.forEach(op => {
      if (!map.has(op.job_id)) {
        map.set(op.job_id, { id: op.job_id, num: op.job_number, name: op.job_name });
      }
    });
    return Array.from(map.values());
  }, [scheduleOperations]);

  // Filtered machines
  const displayedMachines = useMemo(() => {
    if (selectedMachineFilter === 'ALL') return machines;
    return machines.filter(m => m.machine_code === selectedMachineFilter);
  }, [machines, selectedMachineFilter]);

  // Filtered operations
  const displayedOps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scheduleOperations.filter(op => {
      const matchMachine = selectedMachineFilter === 'ALL' || op.machine_code === selectedMachineFilter;
      const matchJob = selectedJobFilter === 'ALL' || String(op.job_id) === selectedJobFilter;
      const matchPriority = selectedPriorityFilter === 'ALL' || op.priority === selectedPriorityFilter;
      const matchQuery = !q || 
        op.job_number.toLowerCase().includes(q) || 
        op.job_name.toLowerCase().includes(q) || 
        op.operation_name.toLowerCase().includes(q) ||
        op.machine_code.toLowerCase().includes(q);
      
      return matchMachine && matchJob && matchPriority && matchQuery;
    });
  }, [scheduleOperations, selectedMachineFilter, selectedJobFilter, selectedPriorityFilter, searchQuery]);

  // Timeline horizon calculation
  const calculatedHorizon = useMemo(() => {
    let maxT = makespan;
    scheduleOperations.forEach(op => {
      if (op.end_time > maxT) maxT = op.end_time;
    });
    return Math.max(Math.ceil(maxT + 4), 24);
  }, [scheduleOperations, makespan]);

  const timelineHours = Array.from({ length: calculatedHorizon + 1 }, (_, i) => i);

  // Color generator for jobs
  const getJobColor = (priority: string, jobId: number) => {
    if (priority === 'URGENT') return 'from-red-600 to-rose-700 border-red-400 text-white shadow-red-500/20';
    if (priority === 'HIGH') return 'from-amber-600 to-orange-700 border-amber-400 text-white shadow-amber-500/20';
    const hues = [
      'from-blue-600 to-cyan-700 border-cyan-400',
      'from-indigo-600 to-purple-700 border-purple-400',
      'from-emerald-600 to-teal-700 border-teal-400',
      'from-violet-600 to-fuchsia-700 border-fuchsia-400',
      'from-teal-600 to-cyan-700 border-cyan-400',
    ];
    return `${hues[jobId % hues.length]} text-white shadow-blue-500/20`;
  };

  const handleMouseEnter = (op: ScheduleOperation, e: React.MouseEvent) => {
    if (draggingOp) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setHoveredOp(op);
  };

  const handleMouseLeave = () => {
    setHoveredOp(null);
  };

  // Check client-side eligibility for visual drag indicator
  const checkEligibility = (op: ScheduleOperation, machine: Machine): boolean => {
    if (machine.status === 'OFFLINE') return false;
    if (op.eligible_machine_ids && op.eligible_machine_ids.length > 0) {
      return op.eligible_machine_ids.includes(machine.id);
    }
    if (op.eligible_machines && op.eligible_machines.length > 0) {
      return op.eligible_machines.some(em => em.machine_id === machine.id);
    }
    return true;
  };

  // Drag handlers
  const handleDragStart = (op: ScheduleOperation, e: React.DragEvent) => {
    setDraggingOp(op);
    setHoveredOp(null);
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: op.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingOp(null);
    setDragTargetMachineId(null);
    setDragTargetStartTime(null);
  };

  const handleDragOverRow = (m: Machine, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingOp) return;
    
    e.dataTransfer.dropEffect = 'move';
    const rowRect = e.currentTarget.getBoundingClientRect();
    const offsetX = Math.max(0, e.clientX - rowRect.left);
    const calculatedTime = Math.max(0, Math.round((offsetX / zoomLevel) * 2) / 2); // snap to 0.5h
    
    setDragTargetMachineId(m.id);
    setDragTargetStartTime(calculatedTime);
    setIsEligibleHover(checkEligibility(draggingOp, m));
  };

  const handleDropOnRow = async (m: Machine, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingOp) return;

    const opToMove = draggingOp;
    const targetStartTime = dragTargetStartTime !== null ? dragTargetStartTime : opToMove.start_time;
    
    handleDragEnd();

    // Trigger operation move
    if (onOperationMove) {
      const result = await onOperationMove(opToMove.id, m.id, targetStartTime);
      if (!result.success) {
        setBannerNotice({
          type: 'error',
          message: result.message || 'Operation move rejected by scheduler validation.'
        });
      } else {
        setBannerNotice({
          type: 'success',
          message: result.message || `Successfully moved ${opToMove.job_number} to ${m.machine_code} at ${targetStartTime}h.`
        });
      }
    }
  };

  // Execute manual reallocation from modal
  const handleManualMoveSubmit = async () => {
    if (!selectedOpForEdit) return;
    const targetMachine = machines.find(m => m.id === modalTargetMachineId);
    if (!targetMachine) return;

    if (onOperationMove) {
      const result = await onOperationMove(selectedOpForEdit.id, modalTargetMachineId, modalTargetStartTime);
      if (!result.success) {
        setBannerNotice({
          type: 'error',
          message: result.message || 'Operation move rejected.'
        });
      } else {
        setBannerNotice({
          type: 'success',
          message: result.message || `Reallocated ${selectedOpForEdit.job_number} to ${targetMachine.machine_code}.`
        });
        setSelectedOpForEdit(null);
      }
    }
  };

  const isDataEmpty = (!scheduleOperations || scheduleOperations.length === 0) || (!machines || machines.length === 0);

  const handleLoadDemoFactory = async () => {
    setIsLoadingDemo(true);
    setBannerNotice(null);
    try {
      if (onLoadDemoFactory) {
        await onLoadDemoFactory();
      } else {
        await api.loadDemoFactory();
        const gantt = await api.getGanttSchedule();
        const newSch = gantt?.data?.schedule || gantt?.schedule;
        if (newSch && onScheduleUpdated) {
          onScheduleUpdated(newSch);
        }
        window.dispatchEvent(new CustomEvent('qfb_factory_data_updated'));
      }
      setBannerNotice({
        type: 'success',
        message: 'Demo factory dataset successfully populated with 6 machines, 10 jobs, and 38 scheduled operations.',
      });
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        message: 'Failed to load demo factory: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleLoadDemoSchedule = async () => {
    setIsLoadingDemo(true);
    setBannerNotice(null);
    try {
      const sch = await api.seedSchedule();
      if (sch && onScheduleUpdated) {
        onScheduleUpdated(sch);
      }
      window.dispatchEvent(new CustomEvent('qfb_factory_data_updated'));
      setBannerNotice({
        type: 'success',
        message: 'Demo quantum schedule generated successfully.',
      });
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        message: 'Failed to generate schedule: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  if (isDataEmpty) {
    return (
      <div className="bg-[#0e172b] border border-amber-500/30 rounded-xl p-8 shadow-xl text-center relative" id="gantt-empty-state">
        {bannerNotice && (
          <div className={`mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            bannerNotice.type === 'error' 
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' 
              : bannerNotice.type === 'warning'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {bannerNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="font-medium">{bannerNotice.message}</span>
            </div>
            <button onClick={() => setBannerNotice(null)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="max-w-md mx-auto py-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">No Schedule Operations Found</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              The Gantt chart has no active sequence data to render. You can automatically load the demo factory dataset (6 benchmark machines, 10 aerospace jobs, 38 operations) to explore schedule allocation and real-time drag-and-drop rescheduling.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="btn-gantt-load-demo"
              disabled={isLoadingDemo}
              onClick={handleLoadDemoFactory}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoadingDemo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading Demo Factory...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Load Demo Factory</span>
                </>
              )}
            </button>
            <button
              id="btn-gantt-load-schedule"
              disabled={isLoadingDemo}
              onClick={handleLoadDemoSchedule}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Load Demo Schedule</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg relative" ref={containerRef}>
      {/* Top Notification / Validation Toast */}
      {bannerNotice && (
        <div className={`mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all animate-fadeIn ${
          bannerNotice.type === 'error' 
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' 
            : bannerNotice.type === 'warning'
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {bannerNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : bannerNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{bannerNotice.message}</span>
          </div>
          <button 
            onClick={() => setBannerNotice(null)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Toolbar: Controls, Filters & Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Machine Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Machine:
            </span>
            <select
              id="gantt-filter-machine"
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Machines (Floor View)</option>
              {machines.map(m => (
                <option key={m.id} value={m.machine_code}>
                  {m.machine_code} - {m.machine_name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300">Job:</span>
            <select
              id="gantt-filter-job"
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Active Jobs ({uniqueJobs.length})</option>
              {uniqueJobs.map(j => (
                <option key={j.id} value={String(j.id)}>
                  {j.num} — {j.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300">Priority:</span>
            <select
              id="gantt-filter-priority"
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="gantt-search-input"
              type="text"
              placeholder="Search Job, Op, Part..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-44 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              id="btn-gantt-zoom-out"
              onClick={() => setZoomLevel(prev => Math.max(14, prev - 4))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">{zoomLevel}px/h</span>
            <button
              id="btn-gantt-zoom-in"
              onClick={() => setZoomLevel(prev => Math.min(52, prev + 4))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="btn-gantt-fit"
              onClick={() => setZoomLevel(26)}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors ml-1 border-l border-slate-800"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Legend & Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] py-2.5 text-slate-300 border-b border-slate-800/60 font-medium">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-slate-400 font-semibold">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-600 inline-block border border-red-400" />
            Urgent Priority
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-600 inline-block border border-amber-400" />
            High Priority
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block border border-cyan-400" />
            Medium / Low Priority
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-stripes-maintenance inline-block border border-amber-500/60 bg-amber-900/40" />
            Maintenance Window
          </span>
        </div>

        <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px]">
          <Move className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Drag operation block to reallocate machine or reschedule</span>
        </div>
      </div>

      {/* Main Gantt Canvas / Timeline Grid */}
      <div className="overflow-x-auto mt-4 pb-4">
        <div style={{ minWidth: `${calculatedHorizon * zoomLevel + 240}px` }}>
          {/* Timeline Header (Hours) */}
          <div className="flex items-center border-b border-slate-700/80 pb-2">
            <div className="w-56 shrink-0 font-mono text-xs font-semibold text-slate-400 pl-2 flex items-center justify-between pr-3">
              <span>MACHINE RESOURCE</span>
              <span className="text-[10px] text-slate-500 font-normal">STATUS</span>
            </div>
            <div className="relative flex-1 h-6">
              {timelineHours.map(h => (
                <div
                  key={h}
                  className="absolute text-[10px] font-mono text-slate-400 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${h * zoomLevel}px` }}
                >
                  <span>{h}h</span>
                  <div className="w-px h-1.5 bg-slate-700 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Machine Rows */}
          <div className="divide-y divide-slate-800/70 relative">
            {displayedMachines.map(m => {
              const machineOps = displayedOps.filter(op => op.machine_id === m.id);
              const isMaintenance = m.status === 'MAINTENANCE';
              const isOffline = m.status === 'OFFLINE';
              const isDragTarget = dragTargetMachineId === m.id;

              return (
                <div 
                  key={m.id} 
                  className={`flex items-center py-2.5 transition-colors group ${
                    isDragTarget 
                      ? (isEligibleHover ? 'bg-cyan-950/30' : 'bg-rose-950/30') 
                      : 'hover:bg-slate-800/20'
                  }`}
                >
                  {/* Machine Header Column */}
                  <div className="w-56 shrink-0 pr-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-cyan-300">{m.machine_code}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        isOffline 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isMaintenance 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5" title={m.machine_name}>
                      {m.machine_name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">
                      {m.location || m.machine_type}
                    </div>
                  </div>

                  {/* Operation Blocks Row / Drop Zone */}
                  <div 
                    onDragOver={(e) => handleDragOverRow(m, e)}
                    onDrop={(e) => handleDropOnRow(m, e)}
                    className={`relative flex-1 h-12 bg-slate-900/40 rounded-lg border overflow-hidden transition-colors ${
                      isDragTarget 
                        ? (isEligibleHover ? 'border-cyan-400 bg-cyan-950/20 ring-1 ring-cyan-400' : 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500') 
                        : 'border-slate-800/60'
                    }`}
                  >
                    {/* Hour grid lines */}
                    {timelineHours.map(h => (
                      <div
                        key={h}
                        className="absolute top-0 bottom-0 w-px bg-slate-800/40 pointer-events-none"
                        style={{ left: `${h * zoomLevel}px` }}
                      />
                    ))}

                    {/* Maintenance Lockout Window (e.g. M05 has 0 to 4h maintenance window) */}
                    {isMaintenance && (
                      <div 
                        style={{ left: 0, width: `${4.0 * zoomLevel}px` }}
                        className="absolute top-0 bottom-0 bg-amber-950/40 border-r-2 border-amber-500 flex items-center justify-center text-amber-300 font-mono text-[10px] gap-1 px-2 z-10 select-none"
                        title="Scheduled Maintenance Window: 0.0h - 4.0h"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">MAINTENANCE (0-4h)</span>
                      </div>
                    )}

                    {/* Offline Full Lockout Overlay */}
                    {isOffline && (
                      <div className="absolute inset-0 bg-rose-950/40 flex items-center justify-center text-rose-300 font-mono text-xs gap-1.5 z-10 select-none">
                        <AlertCircle className="w-4 h-4" />
                        <span>MACHINE OFFLINE — NO OPERATIONS PERMITTED</span>
                      </div>
                    )}

                    {/* Visual Drop Preview Ghost when dragging over */}
                    {isDragTarget && dragTargetStartTime !== null && draggingOp && (
                      <div
                        style={{
                          left: `${dragTargetStartTime * zoomLevel}px`,
                          width: `${Math.max(draggingOp.duration * zoomLevel, 16)}px`,
                        }}
                        className={`absolute top-1 bottom-1 rounded-md border-2 border-dashed z-30 pointer-events-none flex items-center justify-center font-mono text-[10px] font-bold ${
                          isEligibleHover 
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' 
                            : 'border-rose-500 bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isEligibleHover ? `${dragTargetStartTime}h` : 'INCOMPATIBLE'}
                      </div>
                    )}

                    {/* Render Operation Blocks */}
                    {machineOps.map(op => {
                      const leftPos = op.start_time * zoomLevel;
                      const blockWidth = Math.max(op.duration * zoomLevel, 16);
                      const colorClass = getJobColor(op.priority, op.job_id);
                      const isBeingDragged = draggingOp?.id === op.id;

                      return (
                        <div
                          key={op.id}
                          id={`gantt-op-${op.id}`}
                          draggable={!isOffline}
                          onDragStart={(e) => handleDragStart(op, e)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedOpForEdit(op);
                            setModalTargetMachineId(op.machine_id);
                            setModalTargetStartTime(op.start_time);
                          }}
                          onMouseEnter={(e) => handleMouseEnter(op, e)}
                          onMouseLeave={handleMouseLeave}
                          style={{
                            left: `${leftPos}px`,
                            width: `${blockWidth}px`,
                          }}
                          className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r ${colorClass} border px-2 flex flex-col justify-center cursor-grab active:cursor-grabbing shadow-md transition-all hover:scale-[1.02] hover:z-20 ${
                            isBeingDragged ? 'opacity-40 ring-2 ring-white scale-95' : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold font-mono truncate leading-none">
                            <span>{op.job_number}</span>
                            <span className="text-[9px] opacity-85 ml-1 bg-black/30 px-1 rounded">
                              OP-{op.sequence_number * 10}
                            </span>
                          </div>
                          <div className="text-[9px] opacity-90 truncate leading-none mt-1 font-mono">
                            {op.operation_name} ({op.duration}h)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {displayedOps.length === 0 && (
            <div className="py-8 text-center bg-slate-900/40 rounded-xl my-4 border border-dashed border-slate-800">
              <AlertCircle className="w-6 h-6 text-amber-400/80 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">No operations match the selected filter criteria.</p>
              <button
                onClick={() => {
                  setSelectedMachineFilter('ALL');
                  setSelectedJobFilter('ALL');
                  setSelectedPriorityFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hover Floating Tooltip */}
      {hoveredOp && (
        <div
          className="fixed z-50 bg-[#121e36] text-white p-3.5 rounded-xl border border-cyan-500/40 shadow-2xl pointer-events-none text-xs w-80 backdrop-blur-md -translate-x-1/2 -translate-y-full"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span className="font-mono font-bold text-cyan-300 text-sm">{hoveredOp.job_number}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              hoveredOp.priority === 'URGENT' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {hoveredOp.priority}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="text-slate-100 font-semibold truncate">{hoveredOp.job_name}</div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Operation:</span>
              <span className="font-semibold text-slate-200">
                {hoveredOp.operation_name} (Sequence {hoveredOp.sequence_number})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Machine:</span>
              <span className="font-mono text-cyan-300 font-semibold">{hoveredOp.machine_code} ({hoveredOp.machine_name})</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Time Window:</span>
              <span className="font-mono text-slate-200">{hoveredOp.start_time}h &rarr; {hoveredOp.end_time}h ({hoveredOp.duration} hrs)</span>
            </div>

            <div className="flex justify-between border-t border-slate-800 pt-1.5 text-[11px]">
              <span className="text-slate-400">Compatible Machines:</span>
              <span className="font-mono text-emerald-300 font-medium">
                {hoveredOp.eligible_machines && hoveredOp.eligible_machines.length > 0 
                  ? hoveredOp.eligible_machines.map(em => em.machine_code || `M0${em.machine_id}`).join(', ')
                  : 'Universal'}
              </span>
            </div>

            <div className="text-[10px] text-cyan-400/80 italic pt-0.5 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Drag block or click to reallocate to another machine</span>
            </div>
          </div>
        </div>
      )}

      {/* Click-to-Move / Reallocate Modal (supports touch screens & fine adjustments) */}
      {selectedOpForEdit && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0f1b33] border border-cyan-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Move className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-white text-base">Reallocate Operation</h3>
              </div>
              <button 
                onClick={() => setSelectedOpForEdit(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Job:</span>
                  <span className="font-bold text-cyan-300">{selectedOpForEdit.job_number} — {selectedOpForEdit.job_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operation:</span>
                  <span className="font-semibold text-white">{selectedOpForEdit.operation_name} (Sequence {selectedOpForEdit.sequence_number})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-mono text-emerald-400">{selectedOpForEdit.duration} hours</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1">
                  <span className="text-slate-400">Currently On:</span>
                  <span className="font-mono text-slate-200">{selectedOpForEdit.machine_code} ({selectedOpForEdit.start_time}h - {selectedOpForEdit.end_time}h)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Machine</label>
                <select
                  value={modalTargetMachineId}
                  onChange={(e) => setModalTargetMachineId(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-cyan-500"
                >
                  {machines.map(m => {
                    const isEligible = checkEligibility(selectedOpForEdit, m);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.machine_code} - {m.machine_name} {isEligible ? '✓ (Eligible)' : '✗ (Incompatible)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Start Time (Hours)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={modalTargetStartTime}
                    onChange={(e) => setModalTargetStartTime(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                  <span className="text-slate-400 font-mono">hrs</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOpForEdit(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleManualMoveSubmit}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Reallocation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
