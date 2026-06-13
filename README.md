# 🧠 NeuroFall
### Brain-Inspired Intelligent Elderly Fall Detection & Emergency Response System

> **Hackathon Project** — Brain-inspired AI meets wearable IoT for real-time elderly fall detection with instant emergency alerts.

---

## 🚀 Quick Start (3 commands)

```bash
# 1. Install dependencies
pip install numpy pandas scikit-learn matplotlib seaborn flask

# 2. Run everything (data gen + train + dashboard)
python run.py

# 3. Open browser
http://localhost:5000
```

---

## 🏗️ Architecture

```
Sensor Layer        Edge Layer           Cloud AI              Response
─────────────       ──────────           ────────              ────────
Accelerometer  →    Signal Filter   →    LIF SNN Encoding  →   SOS Alert
Gyroscope      →    Normalization   →    Gradient Boosting →   GPS Track
Heart Rate     →    Window (2s)     →    Risk Scoring      →   Dashboard
Barometer      →    BLE/WiFi TX     →    Context Analysis  →   Event Log
```

## 🧠 Brain-Inspired Model

The core innovation is the **Leaky Integrate-and-Fire (LIF) neuron layer**:

1. Raw sensor features are encoded into **spike trains** (just like biological neurons)
2. Rate coding converts signal strength → spike frequency
3. The spiking features are concatenated with raw features
4. A **Gradient Boosting classifier** makes the final fall/no-fall decision

This mimics how the cerebellum processes balance and motion data.

## 📊 Model Performance

| Metric    | Score   |
|-----------|---------|
| Accuracy  | 100%    |
| AUC-ROC   | 1.0000  |
| Precision | 1.0000  |
| Recall    | 1.0000  |
| F1-Score  | 1.0000  |

## 📁 Project Structure

```
neurofall/
├── run.py                  ← One-command launcher
├── data/
│   ├── generate_data.py    ← Synthetic sensor data generator
│   └── fall_dataset.csv    ← Generated dataset (2000 samples)
├── model/
│   ├── train_model.py      ← SNN + GBM training pipeline
│   ├── neurofall_model.pkl ← Saved trained model
│   └── metrics.json        ← Evaluation results
├── utils/
│   ├── lif_layer.py        ← Brain-inspired LIF neuron layer
│   └── detector.py         ← Real-time inference engine
└── dashboard/
    ├── app.py              ← Flask REST API backend
    ├── templates/
    │   └── index.html      ← Live monitoring dashboard UI
    └── static/
        └── model_results.png
```

## 🔌 Hardware Extension (Post-hackathon)

To connect a real MPU-6050 sensor (Arduino/ESP32):
```python
# Replace generate_normal_features() in detector.py with:
import serial
ser = serial.Serial('/dev/ttyUSB0', 9600)
data = ser.readline().decode().strip().split(',')
ax, ay, az = float(data[0]), float(data[1]), float(data[2])
```

## 📲 Twilio Alert Integration

Add to `dashboard/app.py` (requires Twilio account):
```python
from twilio.rest import Client
client = Client(ACCOUNT_SID, AUTH_TOKEN)
if pred == 1:
    client.messages.create(
        body=f"🚨 FALL DETECTED! Location: {lat},{lon}",
        from_='+1234567890', to='+91XXXXXXXXXX'
    )
```

## 👥 Team
Built for [Hackathon Name] | 2 members | 3 days

---
*NeuroFall — Because every second counts.*
