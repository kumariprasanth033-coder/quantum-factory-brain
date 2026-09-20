import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job, JobOperation } from '../types';
import { 
  ArrowLeft, 
  Layers, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface JobDetailsProps {
  jobId: number;
  onBack: () => void;
  onNavigateToGantt: () => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onBack, onNavigateToGantt }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getJobDetails(jobId);
      setJob(data);
    } catch (err: any) {
      alert('Failed to load job details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchDetails();
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
        <p className="text-xs">Loading operation pipeline...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-4">
        <p>Job not found.</p>
        <button onClick={onBack} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs">
          &larr; Back to Jobs
        </button>
      </div>
    );
  }

  const operations = job.operations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white font-mono">{job.job_number}</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              job.priority === 'URGENT' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {job.priority}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {job.product_name} &bull; Customer: <span className="text-slate-200 font-semibold">{job.customer_name}</span>
          </p>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0e172b] border border-slate-800 rounded-xl p-4">
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Operations</span>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
            {operations.length} Stages
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Batch Volume</span>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {job.quantity} units
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Target Due Date</span>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1">
            {new Date(job.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Current State</span>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1 uppercase">
            {job.status}
          </div>
        </div>
      </div>

      {/* Sequential Operation Flow Pipeline (DFJSSP Precedence Graph) */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Sequential Operation Precedence Graph
            </h2>
            <p className="text-xs text-slate-400">
              Operations must execute strictly in chronological sequence: Stage n+1 cannot begin until Stage n finishes.
            </p>
          </div>
          <button
            onClick={onNavigateToGantt}
            className="text-xs text-cyan-400 hover:underline font-semibold"
          >
            Locate in Gantt &rarr;
          </button>
        </div>

        {/* Precedence Nodes */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 overflow-x-auto py-2">
          {operations.map((op, idx) => (
            <React.Fragment key={op.id}>
              <div className="flex-1 min-w-[200px] p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    STAGE {op.sequence_number}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">{op.operation_number}</span>
                </div>
                <div className="font-semibold text-xs text-white truncate">{op.operation_name}</div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Cycle Duration:</span>
                  <span className="font-mono font-bold text-emerald-400">{op.processing_time} hrs</span>
                </div>
              </div>

              {idx < operations.length - 1 && (
                <div className="flex items-center justify-center text-cyan-500/60 shrink-0">
                  <ArrowRight className="w-5 h-5 hidden md:block" />
                  <div className="w-0.5 h-4 bg-cyan-500/40 md:hidden my-1" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Flexible Machine Eligibility Matrix for this Job */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Flexible Machine Eligibility Matrix
          </h2>
          <p className="text-xs text-slate-400">
            DFJSSP flexibility: Operations can be routed to alternative candidate machines with differing cycle times.
          </p>
        </div>

        <div className="space-y-4">
          {operations.map((op) => (
            <div key={op.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300">{op.operation_number}</span>
                  <span className="font-semibold text-xs text-slate-200">{op.operation_name}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Default Baseline: {op.processing_time} hrs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(op.eligible_machines || []).map((em, emIdx) => (
                  <div
                    key={emIdx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      em.is_preferred
                        ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold">{em.machine_code || `M0${em.machine_id}`}</div>
                      <div className="text-[10px] text-slate-400">{em.machine_name || 'Production Cell'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">{em.processing_time}h</div>
                      {em.is_preferred && (
                        <span className="text-[9px] uppercase font-bold text-cyan-400">Preferred</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
