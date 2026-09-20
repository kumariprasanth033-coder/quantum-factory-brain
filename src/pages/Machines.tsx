import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Machine, MachineStatus } from '../types';
import { 
  Cpu, 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  RefreshCw,
  X
} from 'lucide-react';

interface MachinesProps {
  onTriggerReoptimize: () => void;
}

export const Machines: React.FC<MachinesProps> = ({ onTriggerReoptimize }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Milling');
  const [formCapacity, setFormCapacity] = useState(1);
  const [formLocation, setFormLocation] = useState('Main Shop Floor');
  const [formMaint, setFormMaint] = useState('Nominal operating condition');
  const [formStatus, setFormStatus] = useState<MachineStatus>('AVAILABLE');

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const data = await api.getMachines({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setMachines(data || []);
    } catch (err: any) {
      alert('Error fetching machines: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMachines();
  };

  const handleToggleMaintenance = async (machine: Machine) => {
    const nextStatus = machine.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await api.updateMachineStatus(machine.id, nextStatus);
      await fetchMachines();
      if (nextStatus === 'MAINTENANCE') {
        const confirmReopt = window.confirm(
          `Machine ${machine.machine_code} has entered MAINTENANCE. Would you like to run dynamic re-optimization now to re-route pending jobs?`
        );
        if (confirmReopt) {
          onTriggerReoptimize();
        }
      }
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleOpenAdd = () => {
    setEditingMachine(null);
    setFormCode(`M0${machines.length + 1}`);
    setFormName('');
    setFormType('Precision CNC');
    setFormCapacity(1);
    setFormLocation('Bay 2 - Flexible Cell');
    setFormMaint('Nominal operating condition');
    setFormStatus('AVAILABLE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Machine) => {
    setEditingMachine(m);
    setFormCode(m.machine_code);
    setFormName(m.machine_name);
    setFormType(m.machine_type);
    setFormCapacity(m.capacity);
    setFormLocation(m.location);
    setFormMaint(m.maintenance_status);
    setFormStatus(m.status);
    setIsModalOpen(true);
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMachine) {
        await api.updateMachine({
          id: editingMachine.id,
          machine_name: formName,
          machine_type: formType,
          capacity: formCapacity,
          location: formLocation,
          maintenance_status: formMaint,
          status: formStatus,
        });
      } else {
        await api.createMachine({
          machine_code: formCode,
          machine_name: formName,
          machine_type: formType,
          capacity: formCapacity,
          location: formLocation,
          maintenance_status: formMaint,
          status: formStatus,
        });
      }
      setIsModalOpen(false);
      fetchMachines();
    } catch (err: any) {
      alert('Failed to save machine: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this machine resource?')) return;
    try {
      await api.deleteMachine(id);
      fetchMachines();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Machine Fleet & Shop Floor Cells
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure flexible manufacturing resources, maintenance lockouts, and capacity constraints.
          </p>
        </div>

        <button
          id="btn-add-machine"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-900/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Machine</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code, model, location..."
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">All Statuses ({machines.length})</option>
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
            <option value="MAINTENANCE">Maintenance Lockout</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Machines Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
          <p className="text-xs">Fetching shop floor machines...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((m) => {
            const isMaint = m.status === 'MAINTENANCE' || m.status === 'OFFLINE';
            return (
              <div
                key={m.id}
                className={`bg-[#0e172b] border rounded-xl p-5 shadow-lg relative flex flex-col justify-between transition-all ${
                  isMaint ? 'border-red-500/40 bg-red-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-sm text-cyan-400 shadow-inner">
                        {m.machine_code}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{m.machine_name}</h3>
                        <span className="text-xs text-slate-400">{m.machine_type}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isMaint
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : m.status === 'BUSY'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shop Location:</span>
                      <span className="font-medium text-slate-300">{m.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Parallel Capacity:</span>
                      <span className="font-mono text-cyan-400 font-bold">{m.capacity} Part(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Condition Log:</span>
                      <span className="text-slate-300 truncate max-w-[180px]" title={m.maintenance_status}>
                        {m.maintenance_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Machine Actions Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleMaintenance(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isMaint
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                        : 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{isMaint ? 'End Maintenance' : 'Set Maintenance'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Machine Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Remove Machine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e172b] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingMachine ? `Edit Machine ${editingMachine.machine_code}` : 'Register New Machine Resource'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Machine Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingMachine}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MachineStatus)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Machine Name & Specification</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Axis Milling Center Alpha"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cell Type</label>
                  <input
                    type="text"
                    required
                    placeholder="Milling, Turning, Additive..."
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Concurrent Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Factory Location / Bay</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Maintenance Condition Log</label>
                <input
                  type="text"
                  value={formMaint}
                  onChange={(e) => setFormMaint(e.target.value)}
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-900/30"
                >
                  {editingMachine ? 'Save Changes' : 'Register Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
