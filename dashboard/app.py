from flask import Flask, jsonify, render_template_string, request
import sys, os, json, random, pickle
from datetime import datetime
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.lif_layer import LIFLayer

app = Flask(__name__, static_folder='static')

# Load model
with open(os.path.join(os.path.dirname(__file__), '../model/neurofall_model.pkl'), 'rb') as f:
    saved = pickle.load(f)
model  = saved['model']
scaler = saved['scaler']
lif    = saved['lif']

with open(os.path.join(os.path.dirname(__file__), '../model/metrics.json')) as f:
    METRICS = json.load(f)

# In-memory event log
event_log = []
sensor_history = []  # last 30 readings

# ── Helpers ──────────────────────────────────────────────────────────────────
def _extract(ax, ay, az, gx, gy, gz):
    sma = (np.sum(np.abs(ax)) + np.sum(np.abs(ay)) + np.sum(np.abs(az))) / len(ax)
    mag = np.sqrt(ax**2 + ay**2 + az**2)
    return [np.mean(ax),np.std(ax),np.max(ax),np.min(ax),
            np.mean(ay),np.std(ay),np.max(ay),np.min(ay),
            np.mean(az),np.std(az),np.max(az),np.min(az),
            np.mean(gx),np.std(gx),np.max(gx),np.min(gx),
            np.mean(gy),np.std(gy),np.max(gy),np.min(gy),
            np.mean(gz),np.std(gz),np.max(gz),np.min(gz),
            sma, np.mean(mag), np.max(mag), np.std(mag),
            np.percentile(mag,75)-np.percentile(mag,25)]

def gen_normal():
    n=100; t=np.linspace(0,4*np.pi,n)
    ax=0.3*np.sin(t)+np.random.normal(0,.05,n); ay=9.8+0.2*np.sin(t*1.1)+np.random.normal(0,.05,n)
    az=0.2*np.cos(t*.9)+np.random.normal(0,.05,n); gx=0.5*np.sin(t*.8)+np.random.normal(0,.02,n)
    gy=0.3*np.cos(t)+np.random.normal(0,.02,n);   gz=0.4*np.sin(t*1.2)+np.random.normal(0,.02,n)
    return _extract(ax,ay,az,gx,gy,gz), float(np.mean(np.sqrt(ax**2+ay**2+az**2)))

def gen_fall():
    n=100; ax=np.random.normal(0,.1,n); ay=np.random.normal(0,.1,n); az=np.random.normal(0,.1,n)
    gx=np.random.normal(0,.1,n); gy=np.random.normal(0,.1,n); gz=np.random.normal(0,.1,n)
    i,w=30,15
    ax[i:i+w]+=np.random.normal(12,2,w); gx[i:i+w]+=np.random.normal(15,3,w)
    gy[i:i+w]+=np.random.normal(20,4,w)
    return _extract(ax,ay,az,gx,gy,gz), float(np.mean(np.sqrt(ax**2+ay**2+az**2)))

def predict(features):
    X=np.array(features).reshape(1,-1)
    Xs=scaler.transform(X); Xsnn=lif.encode_rate(Xs,10)
    Xc=np.hstack([Xs,Xsnn])
    prob=model.predict_proba(Xc)[0][1]
    return int(prob>=0.5), round(float(prob),4)

# Simulated GPS coords (Durg, CG + small random offset)
BASE_LAT, BASE_LON = 21.1904, 81.2849

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    with open(os.path.join(os.path.dirname(__file__), 'templates/index.html'), encoding='utf-8') as f:
        return f.read()

@app.route('/api/stream')
def stream():
    """Simulate one sensor reading. force_fall=1 to trigger fall."""
    force_fall = request.args.get('force_fall', '0') == '1'
    if force_fall:
        feats, mag = gen_fall()
    else:
        feats, mag = gen_normal()
    pred, prob = predict(feats)

    lat = BASE_LAT + random.uniform(-0.0005, 0.0005)
    lon = BASE_LON + random.uniform(-0.0005, 0.0005)

    reading = {
        'timestamp': datetime.now().strftime('%H:%M:%S'),
        'prediction': pred,
        'probability': prob,
        'magnitude': round(mag, 3),
        'location': {'lat': lat, 'lon': lon},
        'sensor': {
            'ax': round(random.uniform(-1,1) if not force_fall else random.uniform(8,15), 2),
            'ay': round(random.uniform(9.5,10.1) if not force_fall else random.uniform(0,1), 2),
            'az': round(random.uniform(-0.5,0.5) if not force_fall else random.uniform(-10,-5), 2),
        }
    }
    sensor_history.append({'t': reading['timestamp'], 'mag': round(mag,2), 'fall': pred})
    if len(sensor_history) > 30:
        sensor_history.pop(0)

    if pred:
        event_log.insert(0, {
            'time': reading['timestamp'],
            'confidence': f"{prob*100:.1f}%",
            'location': f"{lat:.4f}, {lon:.4f}",
            'status': 'Alert Sent'
        })
        if len(event_log) > 10:
            event_log.pop()

    return jsonify({**reading, 'history': sensor_history, 'events': event_log})

@app.route('/api/metrics')
def metrics():
    return jsonify(METRICS)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
