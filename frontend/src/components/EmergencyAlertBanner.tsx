import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, PhoneCall, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { EmergencyContact } from '../types';

interface EmergencyAlertBannerProps {
  isOpen: boolean;
  onCancel: (reason: string) => void;
  onDismiss: () => void;
  confidence: number;
  magnitude: number;
  patientName: string;
  contacts: EmergencyContact[];
  countdownSeconds?: number;
}

export default function EmergencyAlertBanner({
  isOpen,
  onCancel,
  onDismiss,
  confidence,
  magnitude,
  patientName,
  contacts,
  countdownSeconds = 30,
}: EmergencyAlertBannerProps) {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [isEscalated, setIsEscalated] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(countdownSeconds);
      setIsEscalated(false);
      return;
    }

    setTimeLeft(countdownSeconds);
    setIsEscalated(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsEscalated(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdownSeconds]);

  if (!isOpen) return null;

  const progressPct = (timeLeft / countdownSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#180d15] to-[#0d0912] border-2 border-rose-500/80 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.4)] overflow-hidden">
        {/* Top Glowing Strip */}
        <div className="h-2 w-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    High-Impact Incident Detected
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Conf: {(confidence * 100).toFixed(1)}% &middot; Mag: {magnitude.toFixed(1)} m/s²
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                  Suspected Fall: {patientName}
                </h2>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 30s Countdown Display */}
          <div className="p-4 mb-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-rose-900/40 border-2 border-rose-500/60 font-mono text-2xl font-bold text-rose-200">
                {timeLeft}s
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {timeLeft > 0 ? 'Dignity Verification Window Active' : 'Automatic Escalation Triggered'}
                </p>
                <p className="text-xs text-slate-400">
                  {timeLeft > 0
                    ? 'Patient or caregiver has 30 seconds to cancel before emergency escalation.'
                    : 'Window elapsed. Alert state committed to clinical log.'}
                </p>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => onCancel("Patient indicated 'I am OK' - false alarm stumble")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-semibold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>I'm OK — Cancel Alert</span>
            </button>
          </div>

          {/* Emergency Escalation Cascade */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase">
              <span>Emergency Notification Cascade</span>
              <span className="text-amber-400">Carrier Gateway State</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-sans"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-[10px]">
                      P{c.priority}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-200">{c.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.relation} &middot; {c.phone}</p>
                    </div>
                  </div>

                  {/* Explicit provider status without false delivery claims */}
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono">
                      Notification provider not configured
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Safety Policy:</strong> Live external SMS & automated voice dispatch require configuring external Twilio or Fast2SMS credentials in <code className="text-brand-cyan">.env</code>. In Demo Mode, incident records are safely preserved in SQLite without false delivery claims.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
