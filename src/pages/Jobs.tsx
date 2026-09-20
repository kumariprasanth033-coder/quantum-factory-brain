import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job, JobPriority, JobStatus } from '../types';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Clock, 
  ChevronRight, 
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';

interface JobsProps {
  onSelectJob: (jobId: number) => void;
  onTriggerReoptimize: () => void;
}

export const Jobs: React.FC<JobsProps> = ({ onSelectJob, onTriggerReoptimize }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form State
  const [formNumber, setFormNumber] = useState('');
  const [formCustomer, setFormCustomer] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formQuantity, setFormQuantity] = useState(10);
  const [formPriority, setFormPriority] = useState<JobPriority>('MEDIUM');
  const [formDueDate, setFormDueDate] = useState('');
  const [formEstimatedHours, setFormEstimatedHours] = useState(3.5);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs({
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setJobs(data || []);
    } catch (err: any) {
      alert('Error fetching jobs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [priorityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleOpenAdd = () => {
    setEditingJob(null);
    setFormNumber(`JOB-${String(jobs.length + 1).padStart(3, '0')}`);
    setFormCustomer('');
    setFormProduct('');
    setFormQuantity(15);
    setFormPriority('MEDIUM');
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);
    setFormDueDate(tomorrow);
    setFormEstimatedHours(3.6);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setFormNumber(job.job_number);
    setFormCustomer(job.customer_name);
    setFormProduct(job.product_name);
    setFormQuantity(job.quantity);
    setFormPriority(job.priority);
    setFormDueDate(new Date(job.due_date).toISOString().slice(0, 16));
    setFormEstimatedHours(job.estimated_processing_time);
    setIsModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await api.updateJob({
          id: editingJob.id,
          customer_name: formCustomer,
          product_name: formProduct,
          quantity: formQuantity,
          priority: formPriority,
          due_date: formDueDate,
          estimated_processing_time: formEstimatedHours,
        });
      } else {
        await api.createJob({
          job_number: formNumber,
          customer_name: formCustomer,
          product_name: formProduct,
          quantity: formQuantity,
          priority: formPriority,
          due_date: formDueDate,
          status: 'WAITING',
          estimated_processing_time: formEstimatedHours,
        });
      }
      setIsModalOpen(false);
      fetchJobs();

      if (formPriority === 'URGENT') {
        const confirmReopt = window.confirm(
          'An URGENT production order was recorded. Re-optimize the schedule now?'
        );
        if (confirmReopt) onTriggerReoptimize();
      }
    } catch (err: any) {
      alert('Failed to save job order: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this production work order?')) return;
    try {
      await api.deleteJob(id);
      fetchJobs();
    } catch (err: any) {
      alert('Failed to delete job: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Production Job Orders & Workloads
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-operation jobs, priority hierarchies, and strict customer delivery windows.
          </p>
        </div>

        <button
          id="btn-create-job-order"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-950/40 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Job Order</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Job #, customer, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="WAITING">Waiting</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
            <p className="text-xs">Loading production work orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-3.5">Job Number</th>
                  <th className="p-3.5">Customer & Product</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Due Date & Window</th>
                  <th className="p-3.5">Est. Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-3.5 font-mono font-bold text-cyan-300">
                      {job.job_number}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{job.product_name}</div>
                      <div className="text-[11px] text-slate-400">{job.customer_name}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.priority === 'URGENT'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : job.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">{job.quantity} pcs</td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {new Date(job.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                      {job.estimated_processing_time} hrs
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectJob(job.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px]"
                          title="Inspect Operation Precedence & Eligible Machines"
                        >
                          <span>Precedence</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="Edit Job"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                          title="Delete Job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e172b] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingJob ? `Edit Job Order ${editingJob.job_number}` : 'Create New Work Order'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Job Number</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingJob}
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Priority Hierarchy</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as JobPriority)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer / Client</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Quantum Robotics"
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Titanium Turbine Blisk"
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Batch Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Est. Total Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formEstimatedHours}
                    onChange={(e) => setFormEstimatedHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Due Date & Delivery Window</label>
                <input
                  type="datetime-local"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-950/40"
                >
                  {editingJob ? 'Save Changes' : 'Create Job Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
