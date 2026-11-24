import React, { useState } from 'react';
import HumanBody3D from '../components/HumanBody3D';
import {
  Activity,
  Compass,
  Zap,
  Gauge,
  Sliders,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { SensorTelemetry, ActivityState, SensorNodeStatus } from '../types';

interface LiveMonitoringPageProps {
  telemetry: SensorTelemetry | null;
  onSelectNode: (id: string) => void;
  selectedNode: string | null;
  onSetActivityOverride: (act: ActivityState) => void;
  onTriggerFall: () => void;
}

const ACTIVITIES: ActivityState[] = [
  'Walking',
  'Standing',
  'Sitting',
  'Lying down',
  'Sleeping',
  'Running',
  'Unusual movement',
  'Suspected fall',
];

export default function LiveMonitoringPage({
  telemetry,
  onSelectNode,
  selectedNode,
  onSetActivityOverride,
  onTriggerFall,
}: LiveMonitoringPageProps) {
  const isFall = telemetry?.prediction === 1;
  const currentActivity = telemetry?.activity || 'Walking';
  const prob = (telemetry?.probability ?? 0.0) * 100;

  return (
    <div className="space-y-6">
      {/* ── TOP STATS BAR ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Kinetic Load */}
        <div className="p-4 rounded-2xl bg-[#0b101e]/80 border border-slate-800/80 backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Current G-Magnitude
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white">
              {telemetry?.magnitude?.toFixed(2) || '9.81'}
            </span>
            <span className="text-xs text-slate-500 font-mono">m/s²</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
            Nominal 1.0g gravity alignment
          </span>
        </div>

        {/* Fall Probability */}
        <div className="p-4 rounded-2xl bg-[#0b101e]/80 border border-slate-800/80 backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            SNN Fall Probability
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold font-mono ${
                prob >= 50 ? 'text-rose-400' : prob >= 20 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {prob.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                prob >= 50 ? 'bg-rose-500' : prob >= 20 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, prob)}%` }}
            />
          </div>
        </div>

        {/* Activity State */}
        <div className="p-4 rounded-2xl bg-[#0b101e]/80 border border-slate-800/80 backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            State Classification
          </span>
          <span className="text-xl font-bold text-brand-cyan tracking-tight block truncate">
            {currentActivity}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Real-time SNN Inference
          </span>
        </div>

        {/* Hardware Status */}
        <div className="p-4 rounded-2xl bg-[#0b101e]/80 border border-slate-800/80 backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Sensor Channel Hub
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-white font-mono">6-DOF ONLINE</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            {telemetry?.is_demo ? 'Mode: Simulated Demo' : 'Mode: Hardware Live'}
          </span>
        </div>
      </div>

      {/* ── 3D VISUALIZATION & SENSOR GAUGES ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 3D Human Body (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <HumanBody3D
            landmarks={telemetry?.landmarks || {}}
            selectedNode={selectedNode}
            onSelectNode={onSelectNode}
            activity={currentActivity}
          />

          {/* Activity Simulation Pill Bar */}
          <div className="p-4 rounded-2xl bg-[#0b101d]/90 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-cyan" /> Interactive Activity Simulation
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Click any state to feed realistic biomechanical telemetry into the SNN pipeline
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((act) => {
                const isSelected = currentActivity === act;
                return (
                  <button
                    key={act}
                    onClick={() => {
                      if (act === 'Suspected fall') {
                        onTriggerFall();
                      } else {
                        onSetActivityOverride(act);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                      isSelected
                        ? act === 'Suspected fall'
                          ? 'bg-rose-500 text-white font-bold shadow-glow-danger'
                          : 'bg-brand-cyan text-slate-950 font-bold shadow-glow-cyan'
                        : act === 'Suspected fall'
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50'
                        : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {act}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Sensor Gauges & Biomechanical Diagnostics (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Accelerometer 3-Axis Gauges */}
          <div className="p-5 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-brand-cyan" /> 3-Axis Accelerometer
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Unit: m/s²</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* AX */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400">AX (Mediolateral)</span>
                  <span className="font-bold">{telemetry?.sensor?.ax?.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-rose-400 transition-all duration-200"
                    style={{
                      width: `${Math.min(100, Math.max(0, (((telemetry?.sensor?.ax ?? 0) + 15) / 30) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* AY */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400">AY (Vertical Gravity)</span>
                  <span className="font-bold text-emerald-400">{telemetry?.sensor?.ay?.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-200"
                    style={{
                      width: `${Math.min(100, Math.max(0, (((telemetry?.sensor?.ay ?? 9.8) / 20)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* AZ */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400">AZ (Anteroposterior)</span>
                  <span className="font-bold text-brand-sky">{telemetry?.sensor?.az?.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-brand-sky transition-all duration-200"
                    style={{
                      width: `${Math.min(100, Math.max(0, (((telemetry?.sensor?.az ?? 0) + 15) / 30) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gyroscope Rotational Velocity */}
          <div className="p-5 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-brand-sky" /> 3-Axis Gyroscope
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Unit: rad/s</span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PITCH (GX)</span>
                <span className="text-white font-bold">{telemetry?.sensor?.gx?.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ROLL (GY)</span>
                <span className="text-white font-bold">{telemetry?.sensor?.gy?.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">YAW (GZ)</span>
                <span className="text-white font-bold">{telemetry?.sensor?.gz?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Active Sensor Nodes Summary */}
          <div className="p-5 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" /> Sensor Anchor Nodes
              </span>
              <span className="text-[10px] text-slate-500 font-mono">7 Connected</span>
            </div>

            <div className="space-y-1.5 text-xs font-sans">
              {['head', 'chest', 'waist', 'left_wrist', 'right_wrist', 'left_ankle', 'right_ankle'].map((key) => {
                const landmark = telemetry?.landmarks?.[key] || { status: 'normal', load: 1.0, alert: 'Nominal' };
                return (
                  <button
                    key={key}
                    onClick={() => onSelectNode(key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/60 transition-all text-left"
                  >
                    <span className="capitalize text-slate-300 font-mono text-[11px]">
                      {key.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{landmark.load.toFixed(1)}g</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          landmark.status === 'fall'
                            ? 'bg-rose-500 animate-ping'
                            : landmark.status === 'instability'
                            ? 'bg-orange-500'
                            : landmark.status === 'unusual'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
