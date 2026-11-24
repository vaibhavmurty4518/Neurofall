import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import EmergencyAlertBanner from './components/EmergencyAlertBanner';
import SensorInspectorModal from './components/SensorInspectorModal';

import OverviewPage from './pages/OverviewPage';
import LiveMonitoringPage from './pages/LiveMonitoringPage';
import FallEnginePage from './pages/FallEnginePage';
import AIAssistantPage from './pages/AIAssistantPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EmergencyPage from './pages/EmergencyPage';
import PatientsPage from './pages/PatientsPage';
import ReportsPage from './pages/ReportsPage';

import { Patient, EmergencyContact, FallEvent, SensorTelemetry, ActivityState } from './types';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Patients state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(1);

  // Telemetry stream
  const [telemetry, setTelemetry] = useState<SensorTelemetry | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [activityOverride, setActivityOverride] = useState<ActivityState>('Walking');
  const [forceFallTrigger, setForceFallTrigger] = useState<boolean>(false);

  // Audio / Speech
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState<boolean>(true);

  // Modals
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);

  // Polling Ref
  const isPollingRef = useRef<boolean>(false);

  // Load patients
  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      if (data && data.length > 0) {
        setPatients(data);
        if (!selectedPatientId) setSelectedPatientId(data[0].id);
      }
    } catch (e) {
      console.warn('Failed to load patients:', e);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Live Telemetry Poller (1500ms)
  useEffect(() => {
    const fetchTick = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const fallFlag = forceFallTrigger;
        if (fallFlag) {
          setForceFallTrigger(false); // consume trigger
        }

        const data = await api.getStream(
          selectedPatientId || 1,
          fallFlag,
          fallFlag ? 'Suspected fall' : activityOverride,
          isDemoMode ? 'demo' : 'sensor'
        );

        setTelemetry(data);

        // If fall detected, open emergency countdown modal and speak
        if (data.prediction === 1) {
          setEmergencyModalOpen(true);
          if (voiceAlertsEnabled && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(
              `Warning! Suspected fall detected for ${data.patient?.name || 'patient'}. Emergency cascade initiated.`
            );
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (err) {
        console.warn('Telemetry stream error:', err);
      } finally {
        isPollingRef.current = false;
      }
    };

    fetchTick();
    const interval = setInterval(fetchTick, 1500);
    return () => clearInterval(interval);
  }, [selectedPatientId, activityOverride, forceFallTrigger, isDemoMode, voiceAlertsEnabled]);

  // Fall simulation trigger
  const handleTriggerFall = () => {
    setForceFallTrigger(true);
  };

  // Cancel alert handler
  const handleCancelAlert = async (reason: string) => {
    setEmergencyModalOpen(false);
    if (telemetry?.events && telemetry.events.length > 0) {
      const latestId = telemetry.events[0].id;
      await api.cancelEvent(latestId, reason);
    }
  };

  const isFallActive = telemetry?.prediction === 1 || emergencyModalOpen;
  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  return (
    <div className="flex h-screen bg-[#080c14] text-slate-100 font-sans overflow-hidden">
      {/* ── SIDEBAR NAVIGATION ──────────────────────────────────── */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(id) => {
          setSelectedPatientId(id);
          setActivityOverride('Walking');
        }}
        isFallActive={isFallActive}
      />

      {/* ── MAIN CONTENT AREA ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar
          activeTab={activeTab}
          isFallActive={isFallActive}
          onTriggerFall={handleTriggerFall}
          voiceAlertsEnabled={voiceAlertsEnabled}
          setVoiceAlertsEnabled={setVoiceAlertsEnabled}
          isDemoMode={isDemoMode}
          setIsDemoMode={setIsDemoMode}
          fallProbability={telemetry?.probability ?? 0.0}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPage
                telemetry={telemetry}
                patients={patients}
                onTriggerFall={handleTriggerFall}
                onNavigate={setActiveTab}
                onSelectNode={setSelectedNode}
                onCancelEvent={(id) => api.cancelEvent(id, 'Marked as false alarm from overview')}
              />
            )}

            {activeTab === 'live' && (
              <LiveMonitoringPage
                telemetry={telemetry}
                onSelectNode={setSelectedNode}
                selectedNode={selectedNode}
                onSetActivityOverride={setActivityOverride}
                onTriggerFall={handleTriggerFall}
              />
            )}

            {activeTab === 'engine' && <FallEnginePage />}

            {activeTab === 'assistant' && (
              <AIAssistantPage patientId={selectedPatientId} />
            )}

            {activeTab === 'analytics' && <AnalyticsPage />}

            {activeTab === 'emergency' && (
              <EmergencyPage
                patientId={selectedPatientId}
                contacts={telemetry?.contacts || []}
                onRefreshContacts={loadPatients}
                events={telemetry?.events || []}
                onCancelEvent={(id) => api.cancelEvent(id, 'Caregiver cancelled from emergency center')}
                onTriggerFall={handleTriggerFall}
              />
            )}

            {activeTab === 'patients' && (
              <PatientsPage
                patients={patients}
                onRefreshPatients={loadPatients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                contacts={telemetry?.contacts || []}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsPage telemetry={telemetry} patient={currentPatient || null} />
            )}
          </div>
        </main>
      </div>

      {/* ── EMERGENCY MODAL ─────────────────────────────────────── */}
      <EmergencyAlertBanner
        isOpen={emergencyModalOpen}
        onCancel={handleCancelAlert}
        onDismiss={() => setEmergencyModalOpen(false)}
        confidence={telemetry?.probability ?? 0.98}
        magnitude={telemetry?.magnitude ?? 14.5}
        patientName={currentPatient?.name || 'Ramesh Kumar'}
        contacts={telemetry?.contacts || []}
        countdownSeconds={30}
      />

      {/* ── 3D SENSOR NODE INSPECTOR ────────────────────────────── */}
      <SensorInspectorModal
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
        landmarks={telemetry?.landmarks || {}}
        telemetrySensor={telemetry?.sensor}
      />
    </div>
  );
}
