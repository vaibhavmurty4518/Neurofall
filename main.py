#!/usr/bin/env python3
"""
NeuroFall — Main entry point
Delegates to run.py which handles data generation, model training, and dashboard launch.
"""
import subprocess, sys, os

BASE = os.path.dirname(os.path.abspath(__file__))
sys.exit(subprocess.run([sys.executable, os.path.join(BASE, 'run.py')], cwd=BASE).returncode)
