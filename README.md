# NeuroFall 2.0 — Autonomous Neuromorphic Fall Detection & Telemetry Platform

> *"Falls are the second leading cause of unintentional injury deaths worldwide. NeuroFall was built so that no one has to wait alone on the floor, wondering if help is coming."*

NeuroFall 2.0 transforms elderly fall monitoring from reactive threshold alarms into a predictive, **biologically-inspired safety ecosystem**. Built with **React 18, TypeScript, Three.js, Tailwind CSS**, and a **Leaky Integrate-and-Fire (LIF) Spiking Neural Network (SNN)**, NeuroFall 2.0 provides continuous biomechanical telemetry, interactive 3D human body kinetics, SQLite data persistence, and grounded clinical AI explanations.

---

## Key Features & Product Modules

### 1. Interactive 3D Biomechanical Human Body
- **Real-time 3D Mesh**: Procedural anatomical human body with glassmorphic depth, orbital rotation, smooth zooming, and camera reset controls.
- **7 Anatomical Sensor Anchors**:
  - Cranial Sensor (Head apex)
  - Thoracic IMU (Sternum)
  - Lumbar / Center of Mass Hub (L4/L5 spine)
  - Left & Right Wrist Bands (Resting tremor & protective extension)
  - Left & Right Ankle Anchors (Stride cadence & foot clearance)
- **Dynamic Kinetic Color Coding**:
  - 🟢 **Normal (Nominal)**: Nominal ambulatory movement (< 1.5g)
  - 🟡 **Unusual**: Tremors, erratic swaying, or balance deviation (1.5g – 4.0g)
  - 🟠 **Instability**: Freezing of gait, postural tilt, or tripping (4.0g – 7.0g)
  - 🔴 **Impact / Fall**: High kinetic spike and sustained deceleration (> 7.0g)
- **Interactive Node Inspector**: Click any sensor marker to inspect localized angular velocity, orientation vector, normal thresholds, and clinical telemetry role.

### 2. Biological Neuromorphic SNN Fall Engine
- **Spiking Neural Dynamics**: Replaces naive threshold triggers with a **Leaky Integrate-and-Fire (LIF)** spiking layer.
- **58-Dimensional Feature Pipeline**:
  - Extracts 29 statistical kinematic features across 6 axes (mean, std, min, max, SMA, magnitude IQR).
  - Rate-codes features across 10 temporal simulation timesteps into 29 spike trains.
  - Combines normalized kinematic features and spike frequencies into a 58-vector fed into a `GradientBoostingClassifier`.
- **Low Latency**: Sub-15ms inference latency, verified via live benchmark telemetry.

### 3. False Alarm Prevention & Dignity Safeguard
- **30-Second Dignity Countdown**: When a suspected fall occurs, an urgent confirmation window opens with an audible alert.
- **Patient Autonomy**: The patient can press *"I'm OK — Cancel Alert"* to abort the alert, automatically logging the incident as a benign stumble and preventing unnecessary emergency dispatches.
- **Audited Escalation**: If uncancelled after 30 seconds, the event escalates through the priority cascade (P1 -> P2 -> P3 -> Emergency Services).

### 4. NeuroFall Intelligence (Grounded AI Assistant)
- **Data-Grounded Reasoning**: Connected directly to verified SQLite records of patient profiles, logged incidents, activity distribution, and nocturnal risk windows.
- **Verifiable Citations**: Every insight includes explicit citations of timestamps and record IDs used.
- **Strict Clinical Boundary**: Adheres to strict medical safety guidelines — summarizes telemetry trends without prescribing medications or diagnosing diseases.
- **Provider Abstraction**: Supports Google Gemini or OpenAI when an API key is provided, falling back to a deterministic clinical telemetry engine when offline.

### 5. Multi-Patient Management & Analytics
- **Patient Profiles**: Track age, room/bed, medical condition, prescribed medications, and nocturnal vigilance windows (e.g. 10 PM – 5 AM).
- **Incident Heatmaps**: Hourly incidence charts highlighting nocturnal bathroom fall risks.
- **Mobility Health Index**: 0–100 score reflecting movement variance and gravity vector alignment.

### 6. Clinical Documentation & Exports
- **CSV & JSON Telemetry Exports**: Download complete audit logs for hospital electronic health record (EHR) ingestion.
- **Printable Clinical PDF**: Formatted report layout with summary KPIs, incident log, and non-diagnostic legal disclaimer.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │    Wearable / Smartphone / Demo Simulator     │
                      │         (6-Axis MEMS: ax, ay, az, gx, gy, gz) │
                      └───────────────────────┬───────────────────────┘
                                              │ POST /api/stream/ingest
                                              │ or GET /api/stream
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │         Flask Backend & Preprocessing         │
                      │          • 29 Feature Extraction (SMA, IQR)   │
                      │          • StandardScaler Normalization       │
                      └───────────────────────┬───────────────────────┘
                                              │
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │       SNN LIF Layer (10 Timesteps)            │
                      │         • Membrane potential integration      │
                      │         • Spike rate frequency coding         │
                      └───────────────────────┬───────────────────────┘
                                              │ 58-vector
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │    GradientBoostingClassifier Inference      │
                      │      • Calibrated probability output          │
                      └───────┬───────────────────────────────┬───────┘
                              │                               │
                      Prob >= 0.50                            │ Telemetry Stream
                              ▼                               ▼
                      ┌───────────────┐               ┌───────────────┐
                      │ SQLite DB     │               │ React 18 UI   │
                      │ (fall_events) │               │ • Three.js 3D │
                      └───────┬───────┘               │ • Recharts    │
                              │                       │ • AI Chat     │
                              ▼                       └───────────────┘
                      ┌───────────────┐
                      │ Emergency     │
                      │ 30s Countdown │
                      └───────────────┘
```

---

## Project Structure

```
neurofall/
│
├── backend/
│   ├── database.py              # SQLite schema, migrations, and seeding
│   └── ai_service.py            # NeuroFall Intelligence grounded clinical engine
│
├── dashboard/
│   ├── app.py                   # Unified Flask REST API & static dist server
│   ├── static/                  # Model evaluation plots & assets
│   └── templates/
│       └── index.html           # Legacy fallback template
│
├── frontend/                    # Modern NeuroFall 2.0 Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── HumanBody3D.tsx  # Three.js interactive 3D human body
│   │   │   ├── Navbar.tsx       # Real-time telemetry header & controls
│   │   │   ├── Sidebar.tsx      # Navigation & patient selector
│   │   │   ├── EmergencyAlertBanner.tsx # 30s countdown modal
│   │   │   └── SensorInspectorModal.tsx # Node diagnostics drawer
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx # Clinical dashboard KPIs & waveforms
│   │   │   ├── LiveMonitoringPage.tsx # 3D monitor & sensor gauges
│   │   │   ├── FallEnginePage.tsx # SNN LIF architecture & benchmarks
│   │   │   ├── AIAssistantPage.tsx# NeuroFall Intelligence chat
│   │   │   ├── AnalyticsPage.tsx# Incidence curves & activity distribution
│   │   │   ├── EmergencyPage.tsx# Contact priority cascade & logs
│   │   │   ├── PatientsPage.tsx # Patient profiles & risk windows
│   │   │   └── ReportsPage.tsx  # Printable clinical reports & CSV
│   │   ├── services/
│   │   │   └── api.ts           # Centralized API service
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── App.tsx              # Main application shell
│   │   └── main.tsx             # React DOM entry point
│   ├── package.json             # React, Three.js, Tailwind, Recharts
│   └── vite.config.ts           # Vite bundler & API proxy configuration
│
├── data/
│   ├── generate_data.py         # Synthetic 6-axis IMU generator
│   ├── fall_dataset.csv         # 2,000-window sensor dataset
│   └── neurofall.db             # SQLite database
│
├── model/
│   ├── train_model.py           # SNN + Classifier training pipeline
│   ├── neurofall_model.pkl      # Pickled model bundle (clf, scaler, lif)
│   └── metrics.json             # Accuracy & AUC metrics
│
├── utils/
│   ├── lif_layer.py             # Leaky Integrate-and-Fire layer
│   └── detector.py              # Console CLI test demo
│
├── requirements.txt             # Python dependencies
├── run.py                       # One-command unified launcher
├── test_app.py                  # 10-point integration test suite
└── .env.example                 # Environment variable template
```

---

## Quick Start Guide

### Step 1 — Clone & Navigate
```bash
git clone https://github.com/vaibhavmurty4518/Neurofall.git
cd Neurofall
```

### Step 2 — Set Up Python Virtual Environment
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Linux or macOS:
source venv/bin/activate
```

### Step 3 — Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Launch NeuroFall 2.0 (Single Command)
```bash
python run.py
```

This single command will:
1. Verify the sensor dataset (generates `data/fall_dataset.csv` if missing).
2. Verify the trained SNN model (trains `model/neurofall_model.pkl` if missing).
3. Initialize the SQLite database (`data/neurofall.db`).
4. Start the unified server and serve the modern React 18 + Three.js application at **http://localhost:5000**.

---

## Frontend Development Mode

If you wish to run the Vite hot-reloading development server:

```bash
# In terminal 1: Start Flask backend
python run.py

# In terminal 2: Start Vite dev server
cd frontend
npm run dev
```

Open **http://localhost:5173** (API calls are automatically proxied to Flask on port 5000).

To create a new production bundle:
```bash
cd frontend
npm run build
```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, model status, and uptime |
| `GET` | `/api/metrics` | SNN model accuracy, AUC, precision, and recall |
| `GET` | `/api/stream` | Continuous 6-axis telemetry, activity state, and 3D landmarks |
| `POST` | `/api/stream/ingest` | Open IoT endpoint for real hardware IMU packets |
| `GET` | `/api/patients` | Retrieve all registered patients with incident counts |
| `POST` | `/api/patients` | Register a new patient profile |
| `PUT` | `/api/patients/<id>` | Update patient details or risk windows |
| `DELETE` | `/api/patients/<id>` | Delete patient profile |
| `GET` | `/api/events` | Retrieve fall event history |
| `POST` | `/api/events/<id>/cancel` | Log patient confirmation ("I'm OK") and cancel alert |
| `GET` | `/api/contacts` | Retrieve emergency escalation contacts |
| `POST` | `/api/contacts` | Add emergency contact with priority level |
| `DELETE` | `/api/contacts/<id>` | Remove emergency contact |
| `GET` | `/api/analytics` | Hourly fall curves and activity distribution metrics |
| `GET` | `/api/reports/download` | Download CSV or JSON clinical telemetry log |
| `POST` | `/api/ai/chat` | Query NeuroFall Intelligence using grounded SQLite records |

---

## Running the Automated Test Suite

To verify all 10 integration tests:

```bash
python test_app.py
```

Expected output:
```text
==================================================
  Running NeuroFall 2.0 Comprehensive Test Suite
==================================================
[PASS] GET / -> 200 (Serving Frontend)
[PASS] GET /api/health -> NeuroFall 2.0 Ecosystem (Version: 2.0.0-LIF-GBM)
[PASS] GET /api/metrics -> Accuracy: 100.0% | AUC: 1.0
[PASS] GET /api/patients -> 1 registered patient(s)
[PASS] POST /api/patients -> Created ID #2
[PASS] GET /api/stream (Normal) -> Activity: Walking, Prediction: 0, Landmarks: 7
[PASS] GET /api/stream?force_fall=1 -> Prediction: 1, Conf: 100.0%, Head State: fall
[PASS] GET /api/events -> 3 logged incident(s)
[PASS] POST /api/events/3/cancel -> Verified cancellation logged
[PASS] GET /api/contacts -> 4 emergency contact(s)
[PASS] GET /api/analytics -> False Alarm Rate: 66.7%
[PASS] POST /api/ai/chat -> Answer generated with 1 verified citations
[PASS] DELETE /api/patients/2 -> Cleanup successful
==================================================
  ALL 10 NEUROFALL 2.0 INTEGRATION TESTS PASSED!
==================================================
```

---

## Security & Medical Disclaimers

> [!WARNING]
> **Research & Monitoring Prototype Notice**:
> NeuroFall 2.0 is an automated telemetry and safety monitoring platform designed for caregiver assistance and clinical record-keeping. It is **NOT** a certified medical diagnostic device and does not diagnose disease or replace physician supervision.
>
> **Carrier Gateway Transparency**:
> In Demo Mode, incident alerts are recorded in SQLite and displayed visually in the UI. Live external SMS and automated emergency voice calls require adding carrier credentials (Twilio / Fast2SMS) to `.env`. The interface explicitly indicates when notification gateways are unconfigured to prevent false delivery assumptions.
