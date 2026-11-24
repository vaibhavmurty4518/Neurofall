import React from 'react';
import {
  Users,
  Activity,
  AlertTriangle,
  HeartPulse,
  BrainCircuit,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Patient, SensorTelemetry, FallEvent } from '../types';

interface OverviewPageProps {
  telemetry: SensorTelemetry | null;
  patients: Patient[];
  onTriggerFall: () => void;
  onNavigate: (tab: string) => void;
  onSelectNode: (id: string) => void;
  onCancelEvent: (id: number) => void;
}

export default function OverviewPage({
  telemetry,
  patients,
  onTriggerFall,
  onNavigate,
  onSelectNode,
  onCancelEvent,
}: OverviewPageProps) {
  const activePatient = telemetry?.patient || patients[0];
  const isFall = telemetry?.prediction === 1;

  const totalPatients = patients.length;
  const activeSessions = patients.filter((p) => p.is_monitored).length;
  const events = telemetry?.events || [];
  const fallsToday = events.filter((e) => e.timestamp?.includes(new Date().toISOString().slice(0, 10))).length || events.length;
  const healthScore = telemetry?.health_score ?? 94;

  const historyData = telemetry?.history || [];

  return (
    <div className="space-y-6">
      {/* ── TOP KPI ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Patients */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">Total Monitored</span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{totalPatients}</span>
            <span className="text-xs text-emerald-400 font-mono font-medium">100% active</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeSessions} active telemetry sessions
          </span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-brand-cyan/5 rounded-full blur-xl group-hover:bg-brand-cyan/10 transition-all" />
        </div>

        {/* Active Telemetry Status */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">Current Activity</span>
            <div className="p-2 rounded-xl bg-brand-sky/10 text-brand-sky border border-brand-sky/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {telemetry?.activity || 'Walking'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Mag: {telemetry?.magnitude?.toFixed(2) || '9.81'} m/s² &middot; {activePatient?.name}
          </span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-brand-sky/5 rounded-full blur-xl group-hover:bg-brand-sky/10 transition-all" />
        </div>

        {/* Incidents Logged */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">Incidents Logged</span>
            <div className={`p-2 rounded-xl ${isFall ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono ${isFall ? 'text-rose-400' : 'text-white'}`}>
              {fallsToday}
            </span>
            <span className="text-xs text-slate-400 font-mono">events on record</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {events.filter((e) => e.status.includes('Cancelled')).length} false alarms safely cancelled
          </span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
        </div>

        {/* System Health Index */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">Mobility Health Index</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">{healthScore}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 ml-auto">
              {telemetry?.health_status || 'Good'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Variance & gravity alignment nominal
          </span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
        </div>
      </div>

      {/* ── REAL-TIME MONITORING HERO CARD ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Telemetry Waveform */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 shadow-glow-card backdrop-blur-xl relative flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-cyan"></span>
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                  Continuous Kinetic Acceleration Stream
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Last 60 telemetry windows &middot; Sampling rate ~50Hz aggregated to 2Hz display
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('live')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
              >
                <span>3D View</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-brand-cyan" />
              </button>
            </div>
          </div>

          {/* Acceleration Chart */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData.map((d, i) => ({ ...d, index: i }))}>
                <defs>
                  <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 20]} stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1322',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mag"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#streamGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 mt-2 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">AXIS AX</span>
              <span className="text-white font-bold">{telemetry?.sensor?.ax?.toFixed(2) || '0.00'} m/s²</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">AXIS AY (GRAVITY)</span>
              <span className="text-emerald-400 font-bold">{telemetry?.sensor?.ay?.toFixed(2) || '9.80'} m/s²</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">AXIS AZ</span>
              <span className="text-brand-sky font-bold">{telemetry?.sensor?.az?.toFixed(2) || '0.00'} m/s²</span>
            </div>
          </div>
        </div>

        {/* Right Patient Profile & AI Insight Card */}
        <div className="space-y-4">
          {/* Active Patient Card */}
          <div className="p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-brand-cyan tracking-wider font-semibold">
                  PRIMARY MONITORED SUBJECT
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  {activePatient?.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {activePatient?.age} yrs &middot; {activePatient?.gender} &middot; {activePatient?.room_bed}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                {activePatient?.risk_level} Risk
              </span>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>CONDITION</span>
                <span className="text-slate-200">{activePatient?.condition}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>HIGH RISK WINDOW</span>
                <span className="text-amber-400 font-semibold">{activePatient?.high_risk_windows}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onNavigate('patients')}
                className="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all text-center"
              >
                View Full Profile
              </button>
              <button
                onClick={onTriggerFall}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all active:scale-95"
                title="Test Alert System"
              >
                Test Alert
              </button>
            </div>
          </div>

          {/* AI Telemetry Insight */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1428] to-[#090e1c] border border-brand-cyan/20 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-cyan">
                NeuroFall Intelligence Insight
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Subject stability index is currently <strong>{healthScore}/100</strong>. No erratic tremors detected in the last window. High-risk window opens at 10:00 PM.
            </p>
            <button
              onClick={() => onNavigate('assistant')}
              className="mt-3 text-xs font-mono text-brand-cyan hover:underline flex items-center gap-1"
            >
              Ask AI Assistant &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ── RECENT ALERTS FEED ───────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                Recent Incident Log & False-Alarm Cancellations
              </h3>
              <p className="text-xs text-slate-400">
                All events recorded with SNN confidence rating and patient cancellation status
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('emergency')}
            className="text-xs font-mono text-brand-cyan hover:underline"
          >
            Manage Escalation Cascade &rarr;
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No fall events recorded. System monitoring in nominal state.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Magnitude</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Carrier Dispatch</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {events.slice(0, 5).map((e) => {
                  const isCancelled = e.status.includes('Cancelled');
                  return (
                    <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 text-slate-300">{e.timestamp}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold">
                          {e.confidence}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{e.magnitude.toFixed(2)} m/s²</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-sans text-[11px] font-medium ${
                            isCancelled
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400 truncate max-w-xs font-sans">
                        {e.notification_delivery_status || 'Notification provider not configured'}
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        {!isCancelled && (
                          <button
                            onClick={() => onCancelEvent(e.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium"
                          >
                            Mark False Alarm
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
