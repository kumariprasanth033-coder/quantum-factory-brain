import React, { useState, useMemo } from 'react';
import { ScheduleOperation, Machine } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Filter, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface GanttChartProps {
  scheduleOperations: ScheduleOperation[];
  machines: Machine[];
  makespan?: number;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  scheduleOperations,
  machines,
  makespan = 40.0,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(24); // pixels per hour
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');
  const [hoveredOp, setHoveredOp] = useState<ScheduleOperation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Job unique list for filter dropdown
  const uniqueJobs = useMemo(() => {
    const map = new Map<number, string>();
    scheduleOperations.forEach(op => {
      if (!map.has(op.job_id)) map.set(op.job_id, op.job_number);
    });
    return Array.from(map.entries()).map(([id, num]) => ({ id, num }));
  }, [scheduleOperations]);

  // Filtered machines
  const displayedMachines = useMemo(() => {
    if (selectedMachineFilter === 'ALL') return machines;
    return machines.filter(m => m.machine_code === selectedMachineFilter);
  }, [machines, selectedMachineFilter]);

  // Filtered operations
  const displayedOps = useMemo(() => {
    return scheduleOperations.filter(op => {
      const matchMachine = selectedMachineFilter === 'ALL' || op.machine_code === selectedMachineFilter;
      const matchJob = selectedJobFilter === 'ALL' || String(op.job_id) === selectedJobFilter;
      return matchMachine && matchJob;
    });
  }, [scheduleOperations, selectedMachineFilter, selectedJobFilter]);

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
    ];
    return `${hues[jobId % hues.length]} text-white shadow-blue-500/20`;
  };

  const handleMouseEnter = (op: ScheduleOperation, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setHoveredOp(op);
  };

  const handleMouseLeave = () => {
    setHoveredOp(null);
  };

  return (
    <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg relative">
      {/* Top Toolbar: Controls, Filters & Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Job:</span>
            <select
              id="gantt-filter-job"
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Active Jobs ({uniqueJobs.length})</option>
              {uniqueJobs.map(j => (
                <option key={j.id} value={String(j.id)}>{j.num}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              id="btn-gantt-zoom-out"
              onClick={() => setZoomLevel(prev => Math.max(12, prev - 4))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">{zoomLevel}px/h</span>
            <button
              id="btn-gantt-zoom-in"
              onClick={() => setZoomLevel(prev => Math.min(50, prev + 4))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="btn-gantt-fit"
              onClick={() => setZoomLevel(22)}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors ml-1 border-l border-slate-800"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] py-2.5 text-slate-300 border-b border-slate-800/60 font-medium">
        <span className="text-slate-400">Legend:</span>
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
          Standard / Flexible Job
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-cyan-300 font-mono">
          <Info className="w-3.5 h-3.5" />
          Hover block to inspect precedence & machine routing
        </span>
      </div>

      {/* Main Gantt Canvas / Timeline Grid */}
      <div className="overflow-x-auto mt-4 pb-4">
        <div style={{ minWidth: `${calculatedHorizon * zoomLevel + 220}px` }}>
          {/* Timeline Header (Hours) */}
          <div className="flex items-center border-b border-slate-700/80 pb-2">
            <div className="w-48 shrink-0 font-mono text-xs font-semibold text-slate-400 pl-2">
              MACHINE RESOURCE
            </div>
            <div className="relative flex-1 h-6">
              {timelineHours.map(h => (
                <div
                  key={h}
                  className="absolute text-[10px] font-mono text-slate-500 -translate-x-1/2 flex flex-col items-center"
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
              const isMaintenance = m.status === 'MAINTENANCE' || m.status === 'OFFLINE';

              return (
                <div key={m.id} className="flex items-center py-2.5 hover:bg-slate-800/20 transition-colors group">
                  {/* Machine Header Column */}
                  <div className="w-48 shrink-0 pr-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-cyan-300">{m.machine_code}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        isMaintenance ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5" title={m.machine_name}>
                      {m.machine_name}
                    </div>
                  </div>

                  {/* Operation Blocks Row */}
                  <div className="relative flex-1 h-11 bg-slate-900/40 rounded-lg border border-slate-800/60 overflow-hidden">
                    {/* Hour grid lines */}
                    {timelineHours.map(h => (
                      <div
                        key={h}
                        className="absolute top-0 bottom-0 w-px bg-slate-800/40 pointer-events-none"
                        style={{ left: `${h * zoomLevel}px` }}
                      />
                    ))}

                    {/* Maintenance Overlay if machine offline */}
                    {isMaintenance && (
                      <div className="absolute inset-0 bg-red-950/30 flex items-center justify-center text-red-400 font-mono text-xs gap-1.5 z-10">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>MAINTENANCE LOCKOUT — NO OPERATIONS ASSIGNED</span>
                      </div>
                    )}

                    {/* Render Operations */}
                    {!isMaintenance && machineOps.map(op => {
                      const leftPos = op.start_time * zoomLevel;
                      const blockWidth = Math.max(op.duration * zoomLevel, 14);
                      const colorClass = getJobColor(op.priority, op.job_id);

                      return (
                        <div
                          key={op.id}
                          onMouseEnter={(e) => handleMouseEnter(op, e)}
                          onMouseLeave={handleMouseLeave}
                          style={{
                            left: `${leftPos}px`,
                            width: `${blockWidth}px`,
                          }}
                          className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r ${colorClass} border px-2 flex flex-col justify-center cursor-pointer shadow-sm transition-transform hover:scale-[1.02] hover:z-20`}
                        >
                          <div className="text-[11px] font-bold font-mono truncate leading-none">
                            {op.job_number}
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
        </div>
      </div>

      {/* Hover Floating Tooltip */}
      {hoveredOp && (
        <div
          className="fixed z-50 bg-[#121e36] text-white p-3.5 rounded-xl border border-cyan-500/40 shadow-2xl pointer-events-none text-xs w-72 backdrop-blur-md -translate-x-1/2 -translate-y-full"
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

          <div className="space-y-1 text-slate-300">
            <div className="text-slate-200 font-medium truncate">{hoveredOp.job_name}</div>
            <div className="flex justify-between">
              <span className="text-slate-400">Operation:</span>
              <span className="font-semibold text-slate-200">{hoveredOp.operation_name} (Seq {hoveredOp.sequence_number})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Machine:</span>
              <span className="font-mono text-cyan-300 font-semibold">{hoveredOp.machine_code} ({hoveredOp.machine_name})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Start / Finish:</span>
              <span className="font-mono text-slate-200">{hoveredOp.start_time}h &rarr; {hoveredOp.end_time}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Processing Time:</span>
              <span className="font-mono font-bold text-emerald-400">{hoveredOp.duration} hrs</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1 mt-1 text-[11px]">
              <span className="text-slate-400">Due Date Window:</span>
              <span className="text-amber-300">{new Date(hoveredOp.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
