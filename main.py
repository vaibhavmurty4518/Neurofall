from flask import Flask, jsonify, render_template, request
import sys, os, json, random, pickle
from datetime import datetime
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.lif_layer import LIFLayer

app = Flask(__name__, static_folder='static', template_folder='templates')

# ── Load model ────────────────────────────────────────────────────────────────
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model/neurofall_model.pkl'), 'rb') as f:
    saved = pickle.load(f)
model  = saved['model']
scaler = saved['scaler']
lif    = saved['lif']

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model/metrics.json'), encoding='utf-8') as f:
    METRICS = json.load(f)

# ── In-memory state ───────────────────────────────────────────────────────────
event_log       = []        # fall events (max 20)
sensor_history  = []        # last 60 readings for chart
health_readings = []        # magnitude history for health score
emergency_contacts = []     # [{name, phone, relation}]

BASE_LAT, BASE_LON = 21.1904, 81.2849

# ── Feature extraction ────────────────────────────────────────────────────────
def _extract(ax, ay, az, gx, gy, gz):
    sma = (np.sum(np.abs(ax)) + np.sum(np.abs(ay)) + np.sum(np.abs(az))) / len(ax)
    mag = np.sqrt(ax**2 + ay**2 + az**2)
    return [np.mean(ax), np.std(ax), np.max(ax), np.min(ax),
            np.mean(ay), np.std(ay), np.max(ay), np.min(ay),
            np.mean(az), np.std(az), np.max(az), np.min(az),
            np.mean(gx), np.std(gx), np.max(gx), np.min(gx),
            np.mean(gy), np.std(gy), np.max(gy), np.min(gy),
            np.mean(gz), np.std(gz), np.max(gz), np.min(gz),
            sma, np.mean(mag), np.max(mag), np.std(mag),
            np.percentile(mag, 75) - np.percentile(mag, 25)]

def gen_normal():
    n = 100; t = np.linspace(0, 4 * np.pi, n)
    ax = 0.3*np.sin(t)  + np.random.normal(0, .05, n)
    ay = 9.8 + 0.2*np.sin(t*1.1) + np.random.normal(0, .05, n)
    az = 0.2*np.cos(t*.9) + np.random.normal(0, .05, n)
    gx = 0.5*np.sin(t*.8) + np.random.normal(0, .02, n)
    gy = 0.3*np.cos(t)   + np.random.normal(0, .02, n)
    gz = 0.4*np.sin(t*1.2)+ np.random.normal(0, .02, n)
    return _extract(ax, ay, az, gx, gy, gz), float(np.mean(np.sqrt(ax**2+ay**2+az**2)))

def gen_fall():
    n = 100
    ax = np.random.normal(0, .1, n); ay = np.random.normal(0, .1, n)
    az = np.random.normal(0, .1, n); gx = np.random.normal(0, .1, n)
    gy = np.random.normal(0, .1, n); gz = np.random.normal(0, .1, n)
    i, w = 30, 15
    ax[i:i+w] += np.random.normal(12, 2, w)
    gx[i:i+w] += np.random.normal(15, 3, w)
    gy[i:i+w] += np.random.normal(20, 4, w)
    return _extract(ax, ay, az, gx, gy, gz), float(np.mean(np.sqrt(ax**2+ay**2+az**2)))

def predict(features):
    X   = np.array(features).reshape(1, -1)
    Xs  = scaler.transform(X)
    Xsnn= lif.encode_rate(Xs, 10)
    Xc  = np.hstack([Xs, Xsnn])
    prob= model.predict_proba(Xc)[0][1]
    return int(prob >= 0.5), round(float(prob), 4)

# ── Health Score ──────────────────────────────────────────────────────────────
def compute_health_score():
    """
    Score 0–100 based on recent sensor activity.
    High stability (low variance) + normal gravity range = high score.
    Recent fall events penalize score.
    """
    if len(health_readings) < 5:
        return 95, "Insufficient data"

    mags = np.array(health_readings[-60:])
    variance = float(np.var(mags))
    mean_mag = float(np.mean(mags))

    # Ideal: mean ~9.8 (gravity), low variance
    gravity_deviation = abs(mean_mag - 9.8)
    stability_score   = max(0, 100 - variance * 10)
    gravity_score     = max(0, 100 - gravity_deviation * 15)

    # Penalize recent falls
    recent_falls = sum(1 for e in event_log if True)  # all logged falls
    fall_penalty = min(40, recent_falls * 8)

    raw = (stability_score * 0.5 + gravity_score * 0.5) - fall_penalty
    score = max(0, min(100, int(raw)))

    if score >= 85:   status = "Excellent"
    elif score >= 70: status = "Good"
    elif score >= 50: status = "Fair"
    elif score >= 30: status = "Poor"
    else:             status = "Critical"

    return score, status

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/stream')
def stream():
    force_fall = request.args.get('force_fall', '0') == '1'
    if force_fall:
        feats, mag = gen_fall()
    else:
        feats, mag = gen_normal()

    pred, prob = predict(feats)

    lat = BASE_LAT + random.uniform(-0.0005, 0.0005)
    lon = BASE_LON + random.uniform(-0.0005, 0.0005)
    ts  = datetime.now().strftime('%H:%M:%S')

    # Sensor data
    ax_val = round(random.uniform(-1, 1)    if not force_fall else random.uniform(8, 15),  2)
    ay_val = round(random.uniform(9.5, 10.1) if not force_fall else random.uniform(0, 1),   2)
    az_val = round(random.uniform(-0.5, 0.5) if not force_fall else random.uniform(-10, -5),2)

    reading = {
        'timestamp':  ts,
        'prediction': pred,
        'probability':prob,
        'magnitude':  round(mag, 3),
        'location':   {'lat': lat, 'lon': lon},
        'sensor': {'ax': ax_val, 'ay': ay_val, 'az': az_val}
    }

    health_readings.append(mag)
    if len(health_readings) > 120:
        health_readings.pop(0)

    sensor_history.append({'t': ts, 'mag': round(mag, 2), 'fall': pred})
    if len(sensor_history) > 60:
        sensor_history.pop(0)

    if pred:
        event_log.insert(0, {
            'time':       ts,
            'confidence': f"{prob*100:.1f}%",
            'location':   f"{lat:.4f}, {lon:.4f}",
            'lat':         lat,
            'lon':         lon,
            'status':     'Alert Sent',
            'contacts_notified': [c['name'] for c in emergency_contacts]
        })
        if len(event_log) > 20:
            event_log.pop()

    health_score, health_status = compute_health_score()

    return jsonify({
        **reading,
        'history':       sensor_history,
        'events':        event_log,
        'health_score':  health_score,
        'health_status': health_status,
        'contacts':      emergency_contacts,
    })


@app.route('/api/metrics')
def metrics():
    return jsonify(METRICS)


# ── Emergency Contacts CRUD ───────────────────────────────────────────────────

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    return jsonify(emergency_contacts)


@app.route('/api/contacts', methods=['POST'])
def add_contact():
    data = request.get_json()
    name     = data.get('name', '').strip()
    phone    = data.get('phone', '').strip()
    relation = data.get('relation', '').strip()

    if not name or not phone:
        return jsonify({'error': 'Name and phone are required'}), 400

    contact = {
        'id':       len(emergency_contacts) + 1,
        'name':     name,
        'phone':    phone,
        'relation': relation
    }
    emergency_contacts.append(contact)
    return jsonify({'success': True, 'contact': contact}), 201


@app.route('/api/contacts/<int:cid>', methods=['DELETE'])
def delete_contact(cid):
    global emergency_contacts
    before = len(emergency_contacts)
    emergency_contacts = [c for c in emergency_contacts if c['id'] != cid]
    if len(emergency_contacts) == before:
        return jsonify({'error': 'Contact not found'}), 404
    return jsonify({'success': True})


@app.route('/api/contacts/<int:cid>', methods=['PUT'])
def update_contact(cid):
    data = request.get_json()
    for c in emergency_contacts:
        if c['id'] == cid:
            c['name']     = data.get('name',     c['name'])
            c['phone']    = data.get('phone',    c['phone'])
            c['relation'] = data.get('relation', c['relation'])
            return jsonify({'success': True, 'contact': c})
    return jsonify({'error': 'Contact not found'}), 404


# ── Health history endpoint ───────────────────────────────────────────────────

@app.route('/api/health')
def health_endpoint():
    score, status = compute_health_score()
    return jsonify({
        'score':   score,
        'status':  status,
        'history': health_readings[-60:]
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)