import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Activity
} from 'lucide-react';
import { Patient, FallEvent, SensorTelemetry } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  telemetry: SensorTelemetry | null;
  patient: Patient | null;
}

export default function ReportsPage({ telemetry, patient }: ReportsPageProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (format: 'csv' | 'json') => {
    if (!patient) return;
    setDownloading(true);
    api.downloadReport(format, patient.id);
    setTimeout(() => setDownloading(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const events = telemetry?.events || [];
  const healthScore = telemetry?.health_score ?? 94;

  return (
    <div className="space-y-6">
      {/* ── HEADER & ACTIONS ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-cyan" /> Clinical Telemetry Documentation & Reports
          </h2>
          <p className="text-xs text-slate-400">
            Export verified kinetic telemetry logs, incident records, and longitudinal mobility trends
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleDownload('json')}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-all active:scale-95"
          >
            <FileCode className="w-4 h-4 text-brand-sky" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-glow-cyan active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Clinical PDF</span>
          </button>
        </div>
      </div>

      {/* ── FORMAL CLINICAL REPORT PREVIEW CARD ──────────────────── */}
      <div className="p-8 rounded-3xl bg-white text-slate-900 shadow-2xl space-y-6 font-sans print:p-0 print:shadow-none print:bg-transparent">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-950">
                NEUROFALL 2.0
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                CLINICAL TELEMETRY AUDIT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Autonomous Neuromorphic Fall Detection & Movement Dynamics Log
            </p>
          </div>

          <div className="text-right font-mono text-xs text-slate-600">
            <div>Document Ref: <strong className="text-slate-900">NF-2026-{(patient?.id || 1).toString().padStart(4, '0')}</strong></div>
            <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div>Model: SNN-LIF-GBM v2.0</div>
          </div>
        </div>

        {/* Patient Profile Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">SUBJECT NAME</span>
            <strong className="text-slate-900 font-sans text-sm">{patient?.name || 'Ramesh Kumar'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">AGE & GENDER</span>
            <span className="text-slate-800">{patient?.age || 74} yrs / {patient?.gender || 'Male'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">LOCATION / BED</span>
            <span className="text-slate-800">{patient?.room_bed || 'Room 204-B'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">RISK CLASSIFICATION</span>
            <span className="font-bold text-rose-600">{patient?.risk_level || 'High'} Risk</span>
          </div>
        </div>

        {/* Clinical Assessment Summary */}
        <div className="space-y-2 text-xs leading-relaxed text-slate-700">
          <h4 className="font-bold font-mono text-slate-900 uppercase text-xs">
            1. Diagnosed Condition & Clinical Telemetry Notes
          </h4>
          <p className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            {patient?.condition || 'Early-stage Parkinson\'s with resting tremor and mild gait instability.'}{' '}
            {patient?.notes || 'Nocturnal mobility checks advised between 10:00 PM and 05:00 AM.'}
          </p>
        </div>

        {/* Session Metrics & Telemetry Aggregate */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold font-mono text-slate-900 uppercase text-xs">
            2. Biomechanical Stability & Incident Summary
          </h4>
          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px]">MOBILITY HEALTH INDEX</span>
              <span className="text-xl font-bold text-emerald-600">{healthScore} / 100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px]">TOTAL RECORDED INCIDENTS</span>
              <span className="text-xl font-bold text-slate-900">{events.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px]">FALSE-ALARM CANCELLATIONS</span>
              <span className="text-xl font-bold text-emerald-600">
                {events.filter((e) => e.status.includes('Cancelled')).length}
              </span>
            </div>
          </div>
        </div>

        {/* Incident Table */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold font-mono text-slate-900 uppercase text-xs">
            3. Fall Events & Telemetry Shock Records
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase">
                  <th className="py-2">Event ID</th>
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">SNN Confidence</th>
                  <th className="py-2">Peak Impact (m/s²)</th>
                  <th className="py-2">Resolved Status</th>
                  <th className="py-2">Carrier Gateway State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 text-slate-500">#{e.id}</td>
                    <td className="py-2 text-slate-800">{e.timestamp}</td>
                    <td className="py-2 font-bold text-rose-600">{e.confidence}</td>
                    <td className="py-2 text-slate-800">{e.magnitude.toFixed(2)}</td>
                    <td className="py-2 font-sans font-medium">{e.status}</td>
                    <td className="py-2 text-slate-500 text-[10px]">
                      {e.notification_delivery_status || 'Notification provider not configured'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mandatory Medical Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-[11px] text-slate-600 space-y-1">
          <strong className="text-slate-800 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Mandatory Clinical Disclaimer:
          </strong>
          <p className="leading-relaxed">
            This document is generated by the NeuroFall 2.0 automated telemetry platform for informational and caregiver record-keeping purposes only. It does NOT constitute a clinical diagnosis, certified medical chart, or prescription for treatment. Consult a licensed physician for clinical gait analysis and fall prevention plans.
          </p>
        </div>
      </div>
    </div>
  );
}
