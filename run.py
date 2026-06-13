#!/usr/bin/env python3
"""
NeuroFall — One-command launcher
Runs: data generation → model training → dashboard
"""
import subprocess, sys, os

BASE = os.path.dirname(os.path.abspath(__file__))

def run(script, label):
    print(f"\n{'='*50}\n  {label}\n{'='*50}")
    result = subprocess.run([sys.executable, script], cwd=BASE)
    if result.returncode != 0:
        print(f"[ERROR] {label} failed")
        sys.exit(1)

print("NeuroFall - Brain-Inspired Elderly Fall Detection & Emergency Response System")

# Step 1: Generate data (skip if already exists)
if not os.path.exists(os.path.join(BASE, 'data/fall_dataset.csv')):
    run('data/generate_data.py', 'Step 1/3 — Generating synthetic sensor data')
else:
    print("\n[SKIP] Dataset already exists")

# Step 2: Train model (skip if already trained)
if not os.path.exists(os.path.join(BASE, 'model/neurofall_model.pkl')):
    run('model/train_model.py', 'Step 2/3 — Training brain-inspired SNN model')
else:
    print("[SKIP] Model already trained")

# Step 3: Launch dashboard
print(f"\n{'='*50}")
print("  Step 3/3 — Launching Live Dashboard")
print(f"{'='*50}")
print("\n  Open your browser: http://localhost:5000")
print("  Real-time fall detection dashboard")
print("  Click 'Simulate Fall' to test alerts")
print("  Press Ctrl+C to stop\n")

os.chdir(BASE)
env = os.environ.copy()
env['PYTHONPATH'] = BASE
import subprocess
subprocess.run([sys.executable, 'dashboard/app.py'], cwd=BASE, env=env)
