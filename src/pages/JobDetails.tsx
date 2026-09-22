import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job, JobOperation, Machine } from '../types';
import { getApiErrorMessage } from '../utils/errorParser';
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
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  X,
  Check,
  Upload
} from 'lucide-react';
import { CsvImportModal } from '../components/CsvImportModal';

interface JobDetailsProps {
  jobId: number;
  onBack: () => void;
  onNavigateToGantt: () => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onBack, onNavigateToGantt }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modals state
  const [isAddOpOpen, setIsAddOpOpen] = useState(false);
  const [isEditOpOpen, setIsEditOpOpen] = useState(false);
  const [isAssignMachinesOpen, setIsAssignMachinesOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<JobOperation | null>(null);

  // Form states
  const [opName, setOpName] = useState('');
  const [opNumber, setOpNumber] = useState('');
  const [opDuration, setOpDuration] = useState(1.5);
  const [opSequence, setOpSequence] = useState(1);
  const [opPriority, setOpPriority] = useState<string>('MEDIUM');

  // Candidate machine assignments state
  const [machineCandidates, setMachineCandidates] = useState<{
    machine_id: number;
    processing_time: number;
    is_preferred: boolean;
    selected: boolean;
  }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [jobData, machineList] = await Promise.all([
        api.getJobDetails(jobId),
        api.getMachines()
      ]);
      setJob(jobData);
      setMachines(machineList || []);
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchDetails();
    }
  }, [jobId]);

  const handleOpenAddOp = () => {
    const nextSeq = ((job?.operations || []).length) + 1;
    setOpName('');
    setOpNumber(`OP-0${nextSeq}`);
    setOpDuration(1.5);
    setOpSequence(nextSeq);
    setOpPriority(job?.priority || 'MEDIUM');
    setIsAddOpOpen(true);
  };

  const handleSaveNewOp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim()) {
      setErrorMessage('Please specify an operation name');
      return;
    }

    try {
      await api.createOperation({
        job_id: jobId,
        operation_number: opNumber.trim() || `OP-0${opSequence}`,
        operation_name: opName.trim(),
        processing_time: Number(opDuration) || 1.5,
        sequence_number: Number(opSequence),
        priority: opPriority,
      });
      setIsAddOpOpen(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Failed to add operation');
    }
  };

  const handleOpenEditOp = (op: JobOperation) => {
    setSelectedOp(op);
    setOpName(op.operation_name);
    setOpNumber(op.operation_number);
    setOpDuration(op.processing_time);
    setOpSequence(op.sequence_number);
    setOpPriority(op.priority);
    setIsEditOpOpen(true);
  };

  const handleSaveEditOp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOp) return;

    try {
      await api.updateOperation({
        id: selectedOp.id,
        operation_name: opName.trim(),
        processing_time: Number(opDuration),
        sequence_number: Number(opSequence),
        priority: opPriority as any,
      });
      setIsEditOpOpen(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Failed to update operation');
    }
  };

  const handleDeleteOp = async (opId: number) => {
    if (!window.confirm('Delete this operation stage? Any scheduled sequence will be shifted.')) return;
    try {
      await api.deleteOperation(opId);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Failed to delete operation');
    }
  };

  const handleOpenAssignMachines = (op: JobOperation) => {
    setSelectedOp(op);
    const existingMap = new Map((op.eligible_machines || []).map(em => [em.machine_id, em]));
    
    const candidates = machines.map(m => {
      const existing = existingMap.get(m.id);
      return {
        machine_id: m.id,
        processing_time: existing ? existing.processing_time : op.processing_time,
        is_preferred: existing ? Boolean(existing.is_preferred) : false,
        selected: Boolean(existing),
      };
    });

    setMachineCandidates(candidates);
    setIsAssignMachinesOpen(true);
  };

  const handleSaveMachineAssignments = async () => {
    if (!selectedOp) return;
    const selectedList = machineCandidates
      .filter(mc => mc.selected)
      .map(mc => ({
        machine_id: mc.machine_id,
        processing_time: Number(mc.processing_time) || selectedOp.processing_time,
        is_preferred: mc.is_preferred,
      }));

    if (selectedList.length === 0) {
      alert('Please select at least one eligible machine for this operation.');
      return;
    }

    try {
      await api.assignOperationMachines(selectedOp.id, selectedList);
      setIsAssignMachinesOpen(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Failed to assign machines');
    }
  };

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
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300 mb-0.5">Operation Notice</div>
              <div className="text-slate-300 leading-relaxed">{errorMessage}</div>
            </div>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Back button, Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="job-details-back-btn"
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

        <div className="flex items-center gap-2">
          <button
            id="job-import-ops-btn"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          <button
            id="job-add-operation-btn"
            onClick={handleOpenAddOp}
            className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Operation Stage</span>
          </button>

          <button
            onClick={onNavigateToGantt}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>Timeline Gantt &rarr;</span>
          </button>
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
        {operations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 mb-3">No operations configured for this job yet.</p>
            <button
              onClick={handleOpenAddOp}
              className="px-3 py-1.5 bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 text-xs rounded-lg hover:bg-cyan-600/40"
            >
              + Add First Operation
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 overflow-x-auto py-2">
            {operations.map((op, idx) => (
              <React.Fragment key={op.id}>
                <div className="flex-1 min-w-[220px] p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md relative group">
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

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">
                      {(op.eligible_machines || []).length} eligible machine(s)
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditOp(op)}
                        className="p-1 hover:text-cyan-300 text-slate-400"
                        title="Edit Operation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteOp(op.id)}
                        className="p-1 hover:text-rose-400 text-slate-400"
                        title="Delete Operation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
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
        )}
      </div>

      {/* Flexible Machine Eligibility Matrix for this Job */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Flexible Machine Eligibility Matrix
            </h2>
            <p className="text-xs text-slate-400">
              DFJSSP flexibility: Operations can be routed to alternative candidate machines with differing cycle times.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {operations.map((op) => (
            <div key={op.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300">{op.operation_number}</span>
                  <span className="font-semibold text-xs text-slate-200">{op.operation_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Baseline: {op.processing_time} hrs
                  </span>
                  <button
                    onClick={() => handleOpenAssignMachines(op)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Configure Machines</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(op.eligible_machines || []).length === 0 ? (
                  <div className="col-span-full p-3 bg-slate-950/40 rounded-lg text-xs text-slate-400">
                    No candidate machines assigned yet. Click "Configure Machines" above to assign machine candidates.
                  </div>
                ) : (
                  (op.eligible_machines || []).map((em, emIdx) => (
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
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Operation Modal */}
      {(isAddOpOpen || isEditOpOpen) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e172b] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>{isAddOpOpen ? 'Add Operation Stage' : 'Edit Operation Stage'}</span>
              </h3>
              <button
                onClick={() => { setIsAddOpOpen(false); setIsEditOpOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isAddOpOpen ? handleSaveNewOp : handleSaveEditOp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operation Name</label>
                <input
                  type="text"
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  placeholder="e.g. 5-Axis Precision Contouring"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Operation Code</label>
                  <input
                    type="text"
                    value={opNumber}
                    onChange={(e) => setOpNumber(e.target.value)}
                    placeholder="OP-01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sequence Number</label>
                  <input
                    type="number"
                    min="1"
                    value={opSequence}
                    onChange={(e) => setOpSequence(Number(e.target.value))}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Processing Time (Hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={opDuration}
                    onChange={(e) => setOpDuration(Number(e.target.value))}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={opPriority}
                    onChange={(e) => setOpPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddOpOpen(false); setIsEditOpOpen(false); }}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-600/20"
                >
                  {isAddOpOpen ? 'Create Operation' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Eligible Machines Modal */}
      {isAssignMachinesOpen && selectedOp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e172b] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Configure Eligible Machines: {selectedOp.operation_name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">Stage {selectedOp.sequence_number} &bull; {selectedOp.operation_number}</p>
              </div>
              <button
                onClick={() => setIsAssignMachinesOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Check machines capable of executing this operation, specify machine-specific processing durations, and mark the preferred machine candidate.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {machines.map((m) => {
                const cand = machineCandidates.find(c => c.machine_id === m.id) || {
                  machine_id: m.id,
                  processing_time: selectedOp.processing_time,
                  is_preferred: false,
                  selected: false,
                };

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      cand.selected
                        ? 'bg-slate-900 border-cyan-500/40 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={cand.selected}
                        onChange={(e) => {
                          const updated = machineCandidates.map(c => 
                            c.machine_id === m.id ? { ...c, selected: e.target.checked } : c
                          );
                          setMachineCandidates(updated);
                        }}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{m.machine_code}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({m.machine_type})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{m.machine_name}</div>
                      </div>
                    </div>

                    {cand.selected && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-400">Duration (h):</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={cand.processing_time}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = machineCandidates.map(c => 
                                c.machine_id === m.id ? { ...c, processing_time: val } : c
                              );
                              setMachineCandidates(updated);
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right font-mono text-cyan-300"
                          />
                        </div>

                        <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="preferred-machine"
                            checked={cand.is_preferred}
                            onChange={() => {
                              const updated = machineCandidates.map(c => ({
                                ...c,
                                is_preferred: c.machine_id === m.id,
                              }));
                              setMachineCandidates(updated);
                            }}
                            className="text-cyan-500 focus:ring-0"
                          />
                          <span>Preferred</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsAssignMachinesOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMachineAssignments}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20"
              >
                Save Machine Candidates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultType="operations"
        onImportSuccess={() => {
          fetchDetails();
        }}
      />
    </div>
  );
};
