import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertItem } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  RefreshCw, 
  Check, 
  Trash2,
  Filter
} from 'lucide-react';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(unreadOnly);
      setAlerts(data || []);
    } catch (err: any) {
      alert('Failed to load alerts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [unreadOnly]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markAlertRead(id);
      fetchAlerts();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Factory Alerts & System Disruption Log
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time notifications for schedule bottlenecks, maintenance warnings, and SLA delivery risks.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span>Unread Only</span>
          </label>

          <button
            onClick={fetchAlerts}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            <p className="text-xs">Fetching system alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-300">All clear!</p>
            <p className="text-xs text-slate-500 mt-1">No pending disruptions or warnings found on the shop floor.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                  !alert.is_read
                    ? isCritical
                      ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-950/40'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/40'
                      : 'bg-cyan-950/20 border-cyan-500/50'
                    : 'bg-[#0e172b] border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isCritical
                      ? 'bg-red-500/20 text-red-400'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {isCritical || isWarning ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{alert.title}</h3>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        isCritical
                          ? 'bg-red-500/20 text-red-300'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1.5">
                      {new Date(alert.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold shrink-0"
                    title="Mark as Read"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
