import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Server, 
  Database, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Terminal, 
  Cpu, 
  Building2, 
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [factoryName, setFactoryName] = useState('Amaravati Quantum Aerospace Facility');
  const [shiftCount, setShiftCount] = useState(2);
  const [shiftHours, setShiftHours] = useState(8);
  const [defaultMode, setDefaultMode] = useState('quantum_inspired');

  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch(`${apiUrl}/auth.php?action=status`);
      if (res.ok) {
        setConnectionStatus('SUCCESS: API Gateway responded with HTTP 200 OK');
      } else {
        setConnectionStatus(`WARNING: Received HTTP status ${res.status}`);
      }
    } catch (err: any) {
      setConnectionStatus(`ERROR: Unable to reach endpoint (${err.message})`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveApiUrl = () => {
    api.setBaseUrl(apiUrl);
    alert('API Base URL saved to localStorage! Application will route requests to: ' + apiUrl);
  };

  const handleResetApiUrl = () => {
    api.setBaseUrl('/api');
    setApiUrl('/api');
    alert('Reset API Base URL to default internal gateway (/api).');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <SettingsIcon className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            System Settings & XAMPP Deployment Architecture
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure production shift hours, API endpoints, and review standard Apache/PHP/MySQL deployment guides.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factory Operational Parameters */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Factory Parameters & Shift Model</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Factory Name</label>
              <input
                type="text"
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Shifts per Day</label>
                <select
                  value={shiftCount}
                  onChange={(e) => setShiftCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value={1}>1 Shift (Single)</option>
                  <option value={2}>2 Shifts (Standard Double)</option>
                  <option value={3}>3 Shifts (Continuous 24h)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Shift Duration</label>
                <select
                  value={shiftHours}
                  onChange={(e) => setShiftHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value={8}>8 Hours</option>
                  <option value={10}>10 Hours</option>
                  <option value={12}>12 Hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Default Optimization Engine</label>
              <select
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="quantum_inspired">Quantum-Inspired Simulated Annealing (QUBO)</option>
                <option value="classical">Classical Dispatch Heuristics (SPT/EDD)</option>
                <option value="hybrid">Hybrid Two-Phase Compaction</option>
              </select>
            </div>

            <button
              onClick={() => alert('Factory settings updated successfully.')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Factory Configuration</span>
            </button>
          </div>
        </div>

        {/* API Gateway Switcher */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">REST API Gateway & Host Routing</h2>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-400 leading-relaxed">
              By default, this application speaks to the integrated unified gateway at <code className="text-cyan-300">/api</code>. If deploying to standalone Apache/XAMPP with native PHP 8+, enter the remote URL below.
            </p>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Active API Base URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/api or http://localhost/quantum-factory-brain/backend/api"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                <span>Test Gateway Reachability</span>
              </button>

              <button
                onClick={handleSaveApiUrl}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold"
              >
                Save Base URL
              </button>

              <button
                onClick={handleResetApiUrl}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs"
              >
                Reset to /api
              </button>
            </div>

            {connectionStatus && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-400">
                {connectionStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Production XAMPP / Apache / MySQL Setup Instructions */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white">
              Production XAMPP (Apache + PHP 8 + MySQL 8) Deployment Guide
            </h2>
            <p className="text-xs text-slate-400">
              Complete standalone backend files are provided in <code className="text-emerald-400 font-mono">/backend</code> and <code className="text-emerald-400 font-mono">/database</code>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-cyan-400 font-bold block">1. Database Provisioning</span>
            <p className="text-slate-400 leading-relaxed">
              Open phpMyAdmin or MySQL CLI. Create database <code className="text-slate-200 font-mono">quantum_factory_brain</code> and import <code className="text-slate-200 font-mono">/database/schema.sql</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-cyan-400 font-bold block">2. PHP PDO Configuration</span>
            <p className="text-slate-400 leading-relaxed">
              Verify credentials in <code className="text-slate-200 font-mono">/backend/config/database.php</code> (default: <code className="text-slate-300 font-mono">root / "" / 3306</code>).
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-cyan-400 font-bold block">3. Apache Deployment</span>
            <p className="text-slate-400 leading-relaxed">
              Copy <code className="text-slate-200 font-mono">backend/</code> to <code className="text-slate-200 font-mono">C:/xampp/htdocs/quantum-factory-brain/</code> and point the Base URL above to it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
