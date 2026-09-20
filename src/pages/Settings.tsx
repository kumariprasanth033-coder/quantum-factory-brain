import React, { useState, useEffect } from 'react';
import { api, getStoredFactoryMode } from '../services/api';
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
  ExternalLink,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { FactoryProfile, FactoryMode } from '../types';

export const Settings: React.FC = () => {
  // Factory Profile State
  const [profile, setProfile] = useState<FactoryProfile>({
    factory_code: 'MY-PLANT-01',
    factory_name: 'Amaravati Precision Quantum Plant',
    industry: 'Advanced Aerospace & Robotic Automation',
    location: 'Amaravati Quantum Valley - Bay 4',
    contact_email: 'manager@quantumfactory.local',
    working_hours: '08:00 - 20:00 (Two 8-Hour Shifts)',
    time_zone: 'UTC+05:30 (IST)',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  // Active Mode
  const [activeMode, setActiveMode] = useState<FactoryMode>(getStoredFactoryMode());

  // Operational shifts
  const [shiftCount, setShiftCount] = useState(2);
  const [shiftHours, setShiftHours] = useState(8);
  const [defaultMode, setDefaultMode] = useState('quantum_inspired');

  // API Config
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [resettingDemo, setResettingDemo] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const p = await api.getFactoryProfile();
        if (p) setProfile(p);
      } catch {
        // use default
      }
    };
    loadProfile();
  }, [activeMode]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);
    try {
      const updated = await api.updateFactoryProfile(profile);
      setProfile(updated);
      setProfileNotice('Factory profile saved successfully to persistent database!');
      setTimeout(() => setProfileNotice(null), 4000);
    } catch (err: any) {
      alert('Failed to save factory profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleMode = async (mode: FactoryMode) => {
    try {
      await api.setFactoryMode(mode);
      setActiveMode(mode);
      alert(`Switched to ${mode === 'demo' ? 'Demo Factory' : 'My Factory'} mode.`);
      window.location.reload();
    } catch (err: any) {
      alert('Failed to switch mode: ' + err.message);
    }
  };

  const handleResetDemoData = async () => {
    const confirm = window.confirm(
      'Reset Demo Factory data back to standard 6-machine, 20-job baseline? This will NOT touch your custom factory data.'
    );
    if (!confirm) return;

    setResettingDemo(true);
    try {
      await api.resetDemoData();
      alert('Demo factory data successfully restored to pristine state!');
      window.location.reload();
    } catch (err: any) {
      alert('Failed to reset demo: ' + err.message);
    } finally {
      setResettingDemo(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/health`);
      if (res.ok) {
        const json = await res.json();
        setConnectionStatus(`SUCCESS: API Gateway responded with status: ${json.status || 'OK'}`);
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
    alert('Reset API Base URL to default same-origin gateway (/api).');
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
            Factory Profile, Mode Configuration &amp; Deployment
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage your plant profile, switch between Demo Factory and My Factory, test API endpoints, and view Vercel/XAMPP production deployment specs.
        </p>
      </div>

      {/* Mode Switcher Banner (Requirement #8) */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Factory Data Mode</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              activeMode === 'demo' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              CURRENT: {activeMode === 'demo' ? 'DEMO FACTORY (BENCHMARK)' : 'MY FACTORY (CUSTOM DATA)'}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            {activeMode === 'demo'
              ? 'Currently viewing the 6-machine, 20-job pre-seeded DFJSSP benchmark dataset. Switch to My Factory to input your actual plant operations.'
              : 'Currently viewing your isolated production plant. All machines, jobs, operations, and schedules belong exclusively to this factory.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => handleToggleMode('demo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo Factory
            </button>
            <button
              onClick={() => handleToggleMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'custom'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Factory
            </button>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={resettingDemo}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Restores Demo Factory data back to original state. Leaves your custom factory untouched."
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resettingDemo ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factory Profile Editor Form */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Factory Profile Details</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Multi-Tenant Isolation</span>
          </div>

          {profileNotice && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{profileNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Factory Name</label>
              <input
                type="text"
                value={profile.factory_name}
                onChange={(e) => setProfile({ ...profile, factory_name: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Factory Code</label>
                <input
                  type="text"
                  value={profile.factory_code}
                  onChange={(e) => setProfile({ ...profile, factory_code: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Industry Domain</label>
                <input
                  type="text"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Facility Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  value={profile.contact_email}
                  onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Working Hours &amp; Shifts</label>
                <input
                  type="text"
                  value={profile.working_hours}
                  onChange={(e) => setProfile({ ...profile, working_hours: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Time Zone</label>
                <input
                  type="text"
                  value={profile.time_zone}
                  onChange={(e) => setProfile({ ...profile, time_zone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProfile ? 'Saving Profile...' : 'Save Factory Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* API Gateway Switcher & Connection Health */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">REST API Gateway &amp; Host Routing</h2>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-400 leading-relaxed">
              Default is single-origin relative <code className="text-cyan-300">/api</code> (recommended for Vercel, Cloud Run, and production containers).
            </p>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Active API Base URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/api"
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
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
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

      {/* Production Deployment Architecture Guide */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white">
              Production Deployment Specifications (Vercel + XAMPP + Cloud)
            </h2>
            <p className="text-xs text-slate-400">
              Verified for zero localhost dependencies, proper single-origin routing, and multi-tenant schema isolation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-cyan-400 font-bold block">1. Vercel Serverless Ready</span>
            <p className="text-slate-400 leading-relaxed">
              Configured with <code className="text-slate-200 font-mono">vercel.json</code> rewrites routing <code className="text-slate-200 font-mono">/api/(.*)</code> to the API gateway and single-page routing to <code className="text-slate-200 font-mono">index.html</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-emerald-400 font-bold block">2. Multi-Tenant Schema</span>
            <p className="text-slate-400 leading-relaxed">
              Database schema in <code className="text-slate-200 font-mono">/database/quantum_factory_brain.sql</code> provides <code className="text-slate-300 font-mono">factories</code> table with <code className="text-slate-300 font-mono">factory_id</code> indexing for complete multi-plant isolation.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-purple-400 font-bold block">3. Containerized Runtime</span>
            <p className="text-slate-400 leading-relaxed">
              <code className="text-slate-200 font-mono">Dockerfile.vercel</code> builds a multi-stage production container with Apache 2.4, PHP 8.2 with PDO MySQL, and built static Vite frontend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
