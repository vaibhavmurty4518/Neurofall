import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles,
  CheckCircle2,
  BellRing
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  isFallActive: boolean;
  onTriggerFall: () => void;
  voiceAlertsEnabled: boolean;
  setVoiceAlertsEnabled: (enabled: boolean) => void;
  isDemoMode: boolean;
  setIsDemoMode: (isDemo: boolean) => void;
  fallProbability: number;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview:   { title: 'Clinical Overview Dashboard', subtitle: 'Patient population, live telemetry KPIs and automated safety monitors' },
  live:       { title: '3D Biomechanical Live Monitor', subtitle: 'Real-time 6-axis kinematics, SNN rate coding and interactive anatomical posture' },
  engine:     { title: 'SNN Neuromorphic Fall Engine', subtitle: 'Biological Leaky Integrate-and-Fire layer architecture, metrics and latency benchmark' },
  assistant:  { title: 'NeuroFall Intelligence AI', subtitle: 'Clinical telemetry assistant grounded in verified SQLite telemetry records' },
  analytics:  { title: 'Fall Risk & Mobility Analytics', subtitle: 'Hourly incidence curves, activity distribution and longitudinal stability indices' },
  emergency:  { title: 'Emergency Dispatch & Protocols', subtitle: '30-second cancellation window, contact priority cascade and gateway delivery state' },
  patients:   { title: 'Patient Directory & Care Plans', subtitle: 'Profile records, clinical risk categorization and nocturnal vigilance windows' },
  reports:    { title: 'Clinical Telemetry Reports', subtitle: 'Exportable compliance logs, CSV raw data, and informational medical disclaimers' },
};

export default function Navbar({
  activeTab,
  isFallActive,
  onTriggerFall,
  voiceAlertsEnabled,
  setVoiceAlertsEnabled,
  isDemoMode,
  setIsDemoMode,
  fallProbability,
}: NavbarProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = PAGE_TITLES[activeTab] || { title: 'NeuroFall 2.0', subtitle: 'AI Fall Monitoring' };

  return (
    <header className="h-16 px-6 bg-[#0a0f1d]/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20">
      {/* Title & Breadcrumb */}
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          {meta.title}
          {isFallActive && (
            <span className="flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL ALERT ({(fallProbability * 100).toFixed(1)}%)
            </span>
          )}
        </h1>
        <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-md">
          {meta.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Real-time Streaming Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>STREAMING 2Hz</span>
        </div>

        {/* Demo Mode Badge */}
        <div
          onClick={() => setIsDemoMode(!isDemoMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono font-medium cursor-pointer transition-all select-none ${
            isDemoMode
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
          }`}
          title="Click to toggle Demo vs Hardware Ingestion Mode"
        >
          <Radio className="w-3 h-3" />
          <span>{isDemoMode ? 'DEMO DATA (SIMULATED)' : 'HARDWARE SENSOR MODE'}</span>
        </div>

        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-brand-cyan" />
          <span>{time || '--:--:--'}</span>
        </div>

        {/* Voice Alert Toggle */}
        <button
          onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
          className={`p-2 rounded-xl border transition-all ${
            voiceAlertsEnabled
              ? 'bg-brand-cyan/15 border-brand-cyan/40 text-brand-cyan'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={voiceAlertsEnabled ? 'Speech Synthesis Enabled' : 'Speech Synthesis Muted'}
        >
          {voiceAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Trigger Fall Button */}
        <button
          onClick={onTriggerFall}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-orange-500/20 hover:from-rose-500/30 hover:to-orange-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold tracking-wide shadow-glow-danger transition-all active:scale-95 cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Simulate Fall</span>
        </button>
      </div>
    </header>
  );
}
