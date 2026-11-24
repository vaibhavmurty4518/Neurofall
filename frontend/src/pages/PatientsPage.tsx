import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  UserCheck,
  Clock,
  HeartPulse,
  AlertTriangle,
  Phone,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import { Patient, EmergencyContact } from '../types';
import { api } from '../services/api';

interface PatientsPageProps {
  patients: Patient[];
  onRefreshPatients: () => void;
  selectedPatientId: number;
  onSelectPatient: (id: number) => void;
  contacts: EmergencyContact[];
}

export default function PatientsPage({
  patients,
  onRefreshPatients,
  selectedPatientId,
  onSelectPatient,
  contacts,
}: PatientsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [age, setAge] = useState(70);
  const [gender, setGender] = useState('Male');
  const [roomBed, setRoomBed] = useState('Room 101');
  const [condition, setCondition] = useState('');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [notes, setNotes] = useState('');
  const [highRiskWindows, setHighRiskWindows] = useState('10:00 PM - 05:00 AM');

  const openAddModal = () => {
    setEditingPatient(null);
    setName('');
    setAge(70);
    setGender('Male');
    setRoomBed('Room 101');
    setCondition('');
    setRiskLevel('Medium');
    setNotes('');
    setHighRiskWindows('10:00 PM - 05:00 AM');
    setShowModal(true);
  };

  const openEditModal = (p: Patient) => {
    setEditingPatient(p);
    setName(p.name);
    setAge(p.age);
    setGender(p.gender);
    setRoomBed(p.room_bed);
    setCondition(p.condition);
    setRiskLevel(p.risk_level);
    setNotes(p.notes || '');
    setHighRiskWindows(p.high_risk_windows || '10:00 PM - 05:00 AM');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      age: Number(age),
      gender,
      room_bed: roomBed,
      condition,
      risk_level: riskLevel,
      notes,
      high_risk_windows: highRiskWindows,
    };

    if (editingPatient) {
      await api.updatePatient(editingPatient.id, payload);
    } else {
      await api.addPatient(payload);
    }

    setShowModal(false);
    onRefreshPatients();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this patient and their historical event logs?')) {
      await api.deletePatient(id);
      onRefreshPatients();
    }
  };

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  return (
    <div className="space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-cyan" /> Patient Monitoring Profiles
          </h2>
          <p className="text-xs text-slate-400">
            Care plan baselines, clinical mobility risk categorizations, and nocturnal observation windows
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-glow-cyan active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* ── PATIENT GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => {
          const isSelected = p.id === selectedPatientId;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-[#0f172a] border-brand-cyan shadow-glow-card'
                  : 'bg-[#0b101d]/90 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight">{p.name}</span>
                    {isSelected && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {p.age} y/o &middot; {p.gender} &middot; {p.room_bed}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    p.risk_level === 'High' || p.risk_level === 'Critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : p.risk_level === 'Medium'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {p.risk_level} Risk
                </span>
              </div>

              {/* Condition & Notes */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                <p className="line-clamp-2">
                  <strong className="text-slate-400 font-mono text-[10px] block">CLINICAL CONDITION:</strong>
                  {p.condition}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  High-Risk Window: <span className="text-amber-400">{p.high_risk_windows}</span>
                </p>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 text-[11px]">
                  Incidents Logged: <strong>{p.fall_count ?? 2}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(p);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Edit Patient"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Delete Patient"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ADD/EDIT MODAL ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0c1222] border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingPatient ? 'Edit Patient Profile' : 'Register New Patient Profile'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Room / Bed ID</label>
                  <input
                    type="text"
                    value={roomBed}
                    onChange={(e) => setRoomBed(e.target.value)}
                    placeholder="e.g. Room 204-B"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Clinical Diagnosis & Symptoms</label>
                <input
                  type="text"
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. Early-stage Parkinson's with resting tremor"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Mobility Risk Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan font-mono"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                    <option value="Critical">Critical Risk</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">High-Risk Time Window</label>
                  <input
                    type="text"
                    value={highRiskWindows}
                    onChange={(e) => setHighRiskWindows(e.target.value)}
                    placeholder="10:00 PM - 05:00 AM"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Caregiver & Medication Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Prescription Levodopa 100mg. Night-time bathroom assistance required."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold transition-colors shadow-glow-cyan"
                >
                  {editingPatient ? 'Update Profile' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
