#!/usr/bin/env python3
"""
NeuroFall 2.0 — Autonomous Neuromorphic Fall Detection & Telemetry Platform
One-command launcher:
Data verification -> SNN Model verification -> Frontend asset check -> Live Server launch
"""
import subprocess, sys, os

BASE = os.path.dirname(os.path.abspath(__file__))

def run(script, label):
    print(f"\n{'='*55}\n  {label}\n{'='*55}")
    result = subprocess.run([sys.executable, script], cwd=BASE)
    if result.returncode != 0:
        print(f"[ERROR] {label} failed")
        sys.exit(1)

print("="*65)
print("  NeuroFall 2.0 — Clinical Neuromorphic Fall Monitoring Platform")
print("="*65)

# Step 1: Generate synthetic sensor data if missing
dataset_path = os.path.join(BASE, 'data', 'fall_dataset.csv')
if not os.path.exists(dataset_path):
    run(os.path.join('data', 'generate_data.py'), 'Step 1/3 - Generating synthetic sensor data')
else:
    print("\n[OK] Dataset ready: data/fall_dataset.csv")

# Step 2: Train SNN model if missing
model_path = os.path.join(BASE, 'model', 'neurofall_model.pkl')
if not os.path.exists(model_path):
    run(os.path.join('model', 'train_model.py'), 'Step 2/3 - Training brain-inspired SNN model')
else:
    print("[OK] SNN Model ready: model/neurofall_model.pkl")

# Step 3: Check frontend assets
frontend_dist = os.path.join(BASE, 'frontend', 'dist')
if os.path.exists(frontend_dist):
    print("[OK] Production Frontend: frontend/dist ready (Vite + React 18 + Three.js)")
else:
    print("[INFO] Production frontend build not found; serving built assets or running in development mode.")

# Step 4: Launch server
print(f"\n{'='*55}")
print("  Step 3/3 - Launching NeuroFall 2.0 Unified Server")
print(f"{'='*55}")
print("\n  >> Local Web UI: http://localhost:5000")
print("  >> Real-time 3D Biomechanical Human Body Active")
print("  >> SNN Leaky Integrate-and-Fire Model Online")
print("  >> AI Telemetry Assistant & SQLite Auditing Ready")
print("  >> Press Ctrl+C to stop\n")

dashboard_script = os.path.join(BASE, 'dashboard', 'app.py')
env = os.environ.copy()
env['PYTHONPATH'] = BASE
subprocess.run([sys.executable, dashboard_script], cwd=BASE, env=env)
