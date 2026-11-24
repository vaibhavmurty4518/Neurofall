import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(() => {});
  }, []);

  const hourly = data?.hourly_distribution || [];
  const activityDist = data?.activity_distribution || [];
  const weekly = data?.weekly_trend || [];

  return (
    <div className="space-y-6">
      {/* ── TOP KPI BANNER ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Total Incident Events Logged
          </span>
          <span className="text-3xl font-bold font-mono text-white">
            {data?.total_falls ?? 2}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across active patient monitoring sessions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            False-Alarm Cancellation Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {data?.false_alarm_rate ?? 50.0}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Prevented emergency dispatches via 30s window
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Peak Nocturnal Risk Window
          </span>
          <span className="text-2xl font-bold text-amber-400 tracking-tight block">
            02:00 AM – 05:00 AM
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Correlates with nocturnal bathroom trips
          </span>
        </div>
      </div>

      {/* ── CHARTS ROW 1: HOURLY DISTRIBUTION & ACTIVITY PIE ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Distribution (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-cyan" /> Fall Incident Frequency by Hour of Day
              </h3>
              <p className="text-xs text-slate-400">
                Noticeable concentration during nighttime mobility transitions
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              24-Hour Cycle
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1322',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="falls" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Distribution (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-brand-sky" /> Activity Classification
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown of ambulatory vs sedentary intervals
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityDist}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                  >
                    {activityDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c1322',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-xs font-mono">
            {activityDist.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-400 font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 2: WEEKLY STABILITY TREND ────────────────── */}
      <div className="p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> 7-Day Mobility Stability & Incident Correlation
            </h3>
            <p className="text-xs text-slate-400">
              Tracking gait degradation over time as an early warning for caregiver interventions
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1322',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="stability" name="Stability Score (0-100)" stroke="#10b981" strokeWidth={2.5} />
              <Line type="monotone" dataKey="nearMiss" name="Unusual / Stumbles" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="incidents" name="Confirmed Falls" stroke="#f43f5e" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Disclaimer Card */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Experimental Software Metric:</strong> The Mobility Stability Score and Fall Risk Index are experimental software indicators derived from sensor variance and gravity vector alignment. They are not validated clinical risk indices and do not replace comprehensive geriatric assessment.
          </span>
        </div>
      </div>
    </div>
  );
}
