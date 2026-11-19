import numpy as np
import pandas as pd
import os

np.random.seed(42)

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

WINDOW_SIZE = 100   # 100 samples per window @ 50Hz = 2 seconds
N_WINDOWS   = 2000  # total windows

def simulate_normal_activity(n):
    """Walking, sitting, standing — low magnitude, smooth signal"""
    t = np.linspace(0, 4 * np.pi, n)
    ax = 0.3 * np.sin(t) + np.random.normal(0, 0.05, n)
    ay = 9.8 + 0.2 * np.sin(t * 1.1) + np.random.normal(0, 0.05, n)
    az = 0.2 * np.cos(t * 0.9) + np.random.normal(0, 0.05, n)
    gx = 0.5 * np.sin(t * 0.8) + np.random.normal(0, 0.02, n)
    gy = 0.3 * np.cos(t)        + np.random.normal(0, 0.02, n)
    gz = 0.4 * np.sin(t * 1.2)  + np.random.normal(0, 0.02, n)
    return ax, ay, az, gx, gy, gz

def simulate_fall(n):
    """Fall: sudden spike then near-zero (lying still)"""
    ax = np.random.normal(0, 0.1, n)
    ay = np.random.normal(0, 0.1, n)
    az = np.random.normal(0, 0.1, n)
    gx = np.random.normal(0, 0.1, n)
    gy = np.random.normal(0, 0.1, n)
    gz = np.random.normal(0, 0.1, n)

    impact = int(n * 0.3)
    width  = int(n * 0.15)

    # Impact spike
    ax[impact:impact+width] += np.random.normal(12, 2, width)
    ay[impact:impact+width]  = np.random.normal(0.5, 0.3, width)
    az[impact:impact+width] += np.random.normal(-8, 2, width)
    gx[impact:impact+width] += np.random.normal(15, 3, width)
    gy[impact:impact+width] += np.random.normal(20, 4, width)
    gz[impact:impact+width] += np.random.normal(10, 2, width)

    # Post-fall stillness
    ax[impact+width:] *= 0.05
    ay[impact+width:] *= 0.05
    az[impact+width:] *= 0.05
    gx[impact+width:] *= 0.05
    gy[impact+width:] *= 0.05
    gz[impact+width:] *= 0.05
    return ax, ay, az, gx, gy, gz

def extract_features(ax, ay, az, gx, gy, gz):
    """Statistical features from one window"""
    sma = (np.sum(np.abs(ax)) + np.sum(np.abs(ay)) + np.sum(np.abs(az))) / len(ax)
    magnitude = np.sqrt(ax**2 + ay**2 + az**2)
    feats = [
        np.mean(ax), np.std(ax), np.max(ax), np.min(ax),
        np.mean(ay), np.std(ay), np.max(ay), np.min(ay),
        np.mean(az), np.std(az), np.max(az), np.min(az),
        np.mean(gx), np.std(gx), np.max(gx), np.min(gx),
        np.mean(gy), np.std(gy), np.max(gy), np.min(gy),
        np.mean(gz), np.std(gz), np.max(gz), np.min(gz),
        sma,
        np.mean(magnitude), np.max(magnitude), np.std(magnitude),
        np.percentile(magnitude, 75) - np.percentile(magnitude, 25),
    ]
    return feats

rows  = []
labels = []

for _ in range(N_WINDOWS // 2):
    ax, ay, az, gx, gy, gz = simulate_normal_activity(WINDOW_SIZE)
    rows.append(extract_features(ax, ay, az, gx, gy, gz))
    labels.append(0)

for _ in range(N_WINDOWS // 2):
    ax, ay, az, gx, gy, gz = simulate_fall(WINDOW_SIZE)
    rows.append(extract_features(ax, ay, az, gx, gy, gz))
    labels.append(1)

cols = [
    'ax_mean','ax_std','ax_max','ax_min',
    'ay_mean','ay_std','ay_max','ay_min',
    'az_mean','az_std','az_max','az_min',
    'gx_mean','gx_std','gx_max','gx_min',
    'gy_mean','gy_std','gy_max','gy_min',
    'gz_mean','gz_std','gz_max','gz_min',
    'sma','mag_mean','mag_max','mag_std','mag_iqr'
]

df = pd.DataFrame(rows, columns=cols)
df['label'] = labels
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

output_path = os.path.join(SCRIPT_DIR, 'fall_dataset.csv')
df.to_csv(output_path, index=False)
print(f"Dataset created: {len(df)} samples, {df['label'].sum()} falls, {(df['label']==0).sum()} normal")
print(f"Saved to: {output_path}")
