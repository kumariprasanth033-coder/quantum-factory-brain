import React from 'react';
import { api } from '../services/api';
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Clock 
} from 'lucide-react';

export const Reports: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Production Reports & Data Exporters
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Export production schedules, machine loading telemetry, and system audit logs in CSV format.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print Summary Report</span>
        </button>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Schedule CSV */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Full Production Schedule CSV</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Export comprehensive line-by-line machine task allocations including start times, durations, completion timestamps, and job precedence metadata.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <a
              href={api.getExportScheduleUrl()}
              download
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-900/30"
            >
              <Download className="w-4 h-4" />
              <span>Download Schedule CSV</span>
            </a>
          </div>
        </div>

        {/* Machine Utilization CSV */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Machine Capacity & Utilization CSV</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Summary report detailing busy hours, idle time, utilization percentages, and bottleneck severity across all active production cells.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <a
              href={api.getExportUtilizationUrl()}
              download
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
            >
              <Download className="w-4 h-4" />
              <span>Download Utilization CSV</span>
            </a>
          </div>
        </div>

        {/* Audit Log CSV */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">System Operations & Disruption Log</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Audit trail containing user interactions, dynamic re-optimization triggers, maintenance lockout events, and solver convergence records.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <a
              href={api.getExportLogsUrl()}
              download
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30"
            >
              <Download className="w-4 h-4" />
              <span>Download Audit Trail CSV</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
