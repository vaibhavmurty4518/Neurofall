import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Cpu,
  BrainCircuit,
  TrendingUp,
  AlertOctagon,
  Users,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Patient } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  patients: Patient[];
  selectedPatientId: number;
  onSelectPatient: (id: number) => void;
  isFallActive: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  patients,
  selectedPatientId,
  onSelectPatient,
  isFallActive,
}: SidebarProps) {
  const navItems = [
    { id: 'overview',   label: 'Overview',          icon: LayoutDashboard, badge: null },
    { id: 'live',       label: '3D Live Monitor',   icon: Activity,        badge: isFallActive ? 'FALL' : 'LIVE' },
    { id: 'engine',     label: 'SNN Fall Engine',   icon: Cpu,             badge: null },
    { id: 'assistant',  label: 'AI Intelligence',   icon: BrainCircuit,    badge: 'v2' },
    { id: 'analytics',  label: 'Risk Analytics',    icon: TrendingUp,      badge: null },
    { id: 'emergency',  label: 'Emergency Protocol',icon: AlertOctagon,    badge: isFallActive ? '!' : null },
    { id: 'patients',   label: 'Patient Directory', icon: Users,           badge: null },
    { id: 'reports',    label: 'Clinical Reports',  icon: FileText,        badge: null },
  ];

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  return (
    <aside
      className={`relative z-30 flex flex-col bg-[#0b101c]/95 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-blue shadow-glow-cyan shrink-0">
            <Shield className="w-5 h-5 text-slate-950 font-bold" />
            {isFallActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                NEUROFALL <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">2.0</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono tracking-wider">
                CLINICAL SNN TELEMETRY
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Patient Selector */}
      {!collapsed && (
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-brand-cyan" /> ACTIVE SUBJECT
            </span>
            <span className="text-[10px] text-brand-sky font-semibold">
              {selectedPatient?.risk_level} Risk
            </span>
          </div>
          <select
            value={selectedPatientId}
            onChange={(e) => onSelectPatient(Number(e.target.value))}
            className="w-full bg-[#111928] border border-slate-700/80 rounded-lg text-xs text-slate-200 py-1.5 px-2.5 outline-none focus:border-brand-cyan transition-all cursor-pointer font-sans"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.room_bed || `ID: ${p.id}`})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-brand-cyan/15 to-transparent text-brand-cyan border border-brand-cyan/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-brand-cyan' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <span className="flex-1 text-left truncate tracking-wide">
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    item.badge === 'FALL' || item.badge === '!'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      : 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {collapsed && isActive && (
                <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-brand-cyan" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Telemetry */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500">SNN LIF MODEL</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>PIPELINE</span>
            <span className="text-slate-300">29-Feat + 10-Spike</span>
          </div>
        </div>
      ) : (
        <div className="p-2 mb-2 flex justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="SNN Model Online" />
        </div>
      )}
    </aside>
  );
}
