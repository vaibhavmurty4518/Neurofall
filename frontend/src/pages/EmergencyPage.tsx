import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Phone,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Clock,
  ShieldAlert,
  Save,
  Radio,
  FileCheck
} from 'lucide-react';
import { EmergencyContact, FallEvent } from '../types';
import { api } from '../services/api';

interface EmergencyPageProps {
  patientId?: number;
  contacts: EmergencyContact[];
  onRefreshContacts: () => void;
  events: FallEvent[];
  onCancelEvent: (id: number) => void;
  onTriggerFall: () => void;
}

export default function EmergencyPage({
  patientId = 1,
  contacts,
  onRefreshContacts,
  events,
  onCancelEvent,
  onTriggerFall,
}: EmergencyPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [priority, setPriority] = useState(1);
  const [countdownDuration, setCountdownDuration] = useState(30);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    await api.addContact({
      patient_id: patientId,
      name,
      phone,
      relation,
      priority,
      notify_sms: 1,
      notify_call: 0,
    });

    setName('');
    setPhone('');
    setRelation('');
    setShowAddModal(false);
    onRefreshContacts();
  };

  const handleDeleteContact = async (id: number) => {
    if (confirm('Are you sure you want to remove this emergency contact?')) {
      await api.deleteContact(id);
      onRefreshContacts();
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP NOTIFICATION PROVIDER BANNER ──────────────────────── */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Carrier Notification Gateway Status</h4>
            <p className="text-slate-300 mt-0.5 text-[11px]">
              Active State: <span className="font-mono font-bold text-amber-400">DEMO MODE (Simulated Internal Logs)</span>
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 max-w-sm sm:text-right">
          Live external SMS & voice phone calls require active Twilio or Fast2SMS credentials in <code className="text-brand-cyan">.env</code>.
        </div>
      </div>

      {/* ── EMERGENCY CONTACTS LIST ──────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-cyan" /> Escalation Contact Priority Cascade
            </h3>
            <p className="text-xs text-slate-400">
              When a suspected fall is confirmed, contacts are alerted sequentially in ascending priority order (P1 first)
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-glow-cyan active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Emergency Contact</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 flex items-center justify-center font-mono font-bold text-xs">
                  P{c.priority}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {c.relation} &middot; {c.phone}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    Notification channel: SMS & Call
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteContact(c.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove Contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INCIDENT DISPATCH HISTORY ────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#0b101d]/90 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" /> Complete Fall Event & Notification Audit Trail
          </h3>
          <span className="text-xs font-mono text-slate-500">SQLite Audited Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Peak Mag</th>
                <th className="py-2.5 px-3">Event State</th>
                <th className="py-2.5 px-3">Delivery Verification</th>
                <th className="py-2.5 px-3 text-right">Caregiver Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {events.map((e) => {
                const isCancelled = e.status.includes('Cancelled');
                return (
                  <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-slate-500">#{e.id}</td>
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
                    <td className="py-3 px-3 text-[11px] text-slate-400 max-w-xs truncate font-sans">
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
      </div>

      {/* ── ADD CONTACT MODAL ────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0c1222] border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Emergency Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-slate-400 font-mono block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunita Kumar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Relationship</label>
                <input
                  type="text"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="e.g. Wife, Son, Attending Doctor"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Alert Priority (1 = First)</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan font-mono"
                >
                  <option value={1}>P1 - Primary First Call</option>
                  <option value={2}>P2 - Secondary Escalation</option>
                  <option value={3}>P3 - Attending Physician</option>
                  <option value={4}>P4 - Emergency Services (108)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold transition-colors shadow-glow-cyan"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
