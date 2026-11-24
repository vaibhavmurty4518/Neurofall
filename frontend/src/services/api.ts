import { Patient, EmergencyContact, FallEvent, SensorTelemetry, ActivityState } from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getMetrics() {
    const res = await fetch(`${API_BASE}/metrics`);
    return res.json();
  },

  async getStream(
    patientId: number = 1,
    forceFall: boolean = false,
    activity: ActivityState = 'Walking',
    mode: 'demo' | 'sensor' = 'demo'
  ): Promise<SensorTelemetry> {
    const params = new URLSearchParams({
      patient_id: patientId.toString(),
      force_fall: forceFall ? '1' : '0',
      activity,
      mode,
    });
    const res = await fetch(`${API_BASE}/stream?${params.toString()}`);
    return res.json();
  },

  async getPatients(): Promise<Patient[]> {
    const res = await fetch(`${API_BASE}/patients`);
    return res.json();
  },

  async getPatient(id: number) {
    const res = await fetch(`${API_BASE}/patients/${id}`);
    return res.json();
  },

  async addPatient(patient: Partial<Patient>) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    return res.json();
  },

  async updatePatient(id: number, patient: Partial<Patient>) {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    return res.json();
  },

  async deletePatient(id: number) {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getEvents(patientId?: number): Promise<FallEvent[]> {
    const url = patientId ? `${API_BASE}/events?patient_id=${patientId}` : `${API_BASE}/events`;
    const res = await fetch(url);
    return res.json();
  },

  async cancelEvent(id: number, reason: string) {
    const res = await fetch(`${API_BASE}/events/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async getContacts(patientId: number = 1): Promise<EmergencyContact[]> {
    const res = await fetch(`${API_BASE}/contacts?patient_id=${patientId}`);
    return res.json();
  },

  async addContact(contact: Partial<EmergencyContact>) {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    return res.json();
  },

  async deleteContact(id: number) {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    return res.json();
  },

  async askAIChat(message: string, patientId: number = 1) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, patient_id: patientId }),
    });
    return res.json();
  },

  async downloadReport(format: 'csv' | 'json' = 'csv', patientId: number = 1) {
    window.open(`${API_BASE}/reports/download?format=${format}&patient_id=${patientId}`, '_blank');
  },
};
