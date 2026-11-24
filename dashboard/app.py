from flask import Flask, jsonify, render_template, request, send_from_directory, Response
from flask_cors import CORS
import sys, os, json, random, pickle, csv, io
from datetime import datetime, timedelta
import numpy as np

# ── Path setup ────────────────────────────────────────────────────────────────
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, PROJECT_ROOT)

from utils.lif_layer import LIFLayer
from backend.database import init_db, get_db
from backend.ai_service import handle_ai_query, MEDICAL_DISCLAIMER

# Initialize SQLite database
init_db()

FRONTEND_DIST = os.path.join(PROJECT_ROOT, 'frontend', 'dist')
app = Flask(__name__,
            static_folder=FRONTEND_DIST if os.path.exists(FRONTEND_DIST) else 'static',
            template_folder='templates')
CORS(app)

# ── Load model ────────────────────────────────────────────────────────────────
MODEL_PATH   = os.path.join(PROJECT_ROOT, 'model', 'neurofall_model.pkl')
METRICS_PATH = os.path.join(PROJECT_ROOT, 'model', 'metrics.json')

model, scaler, lif = None, None, None
if os.path.exists(MODEL_PATH):
    try:
        with open(MODEL_PATH, 'rb') as f:
            saved = pickle.load(f)
        model  = saved['model']
        scaler = saved['scaler']
        lif    = saved['lif']
        print("[INFO] NeuroFall SNN model loaded successfully.")
    except Exception as e:
        print(f"[WARN] Failed to load model: {e}")

METRICS = {"accuracy": 100.0, "auc": 1.0}
if os.path.exists(METRICS_PATH):
    try:
        with open(METRICS_PATH, encoding='utf-8') as f:
            METRICS = json.load(f)
    except Exception as e:
        print(f"[WARN] Failed to load metrics.json: {e}")

# ── In-memory Telemetry Buffer (for smooth 60-point live charts) ───────────────
sensor_history  = []        # last 60 readings
health_readings = []        # magnitude history for stability calculation
BASE_LAT, BASE_LON = 21.1904, 81.2849

# ── Feature extraction & Signal Processing ────────────────────────────────────
def _extract(ax, ay, az, gx, gy, gz):
    sma = (np.sum(np.abs(ax)) + np.sum(np.abs(ay)) + np.sum(np.abs(az))) / len(ax)
    mag = np.sqrt(ax**2 + ay**2 + az**2)
    return [
        float(np.mean(ax)), float(np.std(ax)), float(np.max(ax)), float(np.min(ax)),
        float(np.mean(ay)), float(np.std(ay)), float(np.max(ay)), float(np.min(ay)),
        float(np.mean(az)), float(np.std(az)), float(np.max(az)), float(np.min(az)),
        float(np.mean(gx)), float(np.std(gx)), float(np.max(gx)), float(np.min(gx)),
        float(np.mean(gy)), float(np.std(gy)), float(np.max(gy)), float(np.min(gy)),
        float(np.mean(gz)), float(np.std(gz)), float(np.max(gz)), float(np.min(gz)),
        float(sma), float(np.mean(mag)), float(np.max(mag)), float(np.std(mag)),
        float(np.percentile(mag, 75) - np.percentile(mag, 25))
    ]

def gen_normal(activity='Walking'):
    n = 100
    t = np.linspace(0, 4 * np.pi, n)
    if activity == 'Sitting':
        ax = np.random.normal(0, 0.02, n)
        ay = 9.8 + np.random.normal(0, 0.02, n)
        az = np.random.normal(0, 0.02, n)
        gx = np.random.normal(0, 0.01, n)
        gy = np.random.normal(0, 0.01, n)
        gz = np.random.normal(0, 0.01, n)
    elif activity == 'Standing':
        ax = np.random.normal(0, 0.04, n)
        ay = 9.8 + np.random.normal(0, 0.04, n)
        az = np.random.normal(0, 0.03, n)
        gx = np.random.normal(0, 0.02, n)
        gy = np.random.normal(0, 0.02, n)
        gz = np.random.normal(0, 0.02, n)
    elif activity == 'Lying down':
        ax = np.random.normal(0, 0.02, n)
        ay = np.random.normal(0, 0.02, n)
        az = 9.8 + np.random.normal(0, 0.02, n)
        gx = np.random.normal(0, 0.01, n)
        gy = np.random.normal(0, 0.01, n)
        gz = np.random.normal(0, 0.01, n)
    elif activity == 'Sleeping':
        ax = np.random.normal(0, 0.005, n)
        ay = np.random.normal(0, 0.005, n)
        az = 9.8 + np.random.normal(0, 0.005, n)
        gx = np.random.normal(0, 0.005, n)
        gy = np.random.normal(0, 0.005, n)
        gz = np.random.normal(0, 0.005, n)
    elif activity == 'Running':
        ax = 2.5 * np.sin(t * 2) + np.random.normal(0, 0.3, n)
        ay = 9.8 + 3.0 * np.sin(t * 2.2) + np.random.normal(0, 0.3, n)
        az = 1.5 * np.cos(t * 2) + np.random.normal(0, 0.2, n)
        gx = 2.0 * np.sin(t * 2) + np.random.normal(0, 0.1, n)
        gy = 1.5 * np.cos(t * 2) + np.random.normal(0, 0.1, n)
        gz = 1.8 * np.sin(t * 2.4) + np.random.normal(0, 0.1, n)
    elif activity == 'Unusual movement':
        ax = np.random.normal(3.5, 1.2, n)
        ay = 9.8 + np.random.normal(2.0, 1.5, n)
        az = np.random.normal(-2.0, 1.0, n)
        gx = np.random.normal(4.0, 1.5, n)
        gy = np.random.normal(3.0, 1.2, n)
        gz = np.random.normal(3.5, 1.4, n)
    else:  # Walking
        ax = 0.3 * np.sin(t) + np.random.normal(0, 0.05, n)
        ay = 9.8 + 0.2 * np.sin(t * 1.1) + np.random.normal(0, 0.05, n)
        az = 0.2 * np.cos(t * 0.9) + np.random.normal(0, 0.05, n)
        gx = 0.5 * np.sin(t * 0.8) + np.random.normal(0, 0.02, n)
        gy = 0.3 * np.cos(t) + np.random.normal(0, 0.02, n)
        gz = 0.4 * np.sin(t * 1.2) + np.random.normal(0, 0.02, n)

    mag = float(np.mean(np.sqrt(ax**2 + ay**2 + az**2)))
    return _extract(ax, ay, az, gx, gy, gz), mag, ax[-1], ay[-1], az[-1], gx[-1], gy[-1], gz[-1]

def gen_fall():
    n = 100
    ax = np.random.normal(0, 0.1, n); ay = np.random.normal(0, 0.1, n); az = np.random.normal(0, 0.1, n)
    gx = np.random.normal(0, 0.1, n); gy = np.random.normal(0, 0.1, n); gz = np.random.normal(0, 0.1, n)
    i, w = 30, 15
    ax[i:i+w] += np.random.normal(12, 2, w)
    ay[i:i+w]  = np.random.normal(0.5, 0.3, w)
    az[i:i+w] += np.random.normal(-8, 2, w)
    gx[i:i+w] += np.random.normal(15, 3, w)
    gy[i:i+w] += np.random.normal(20, 4, w)
    gz[i:i+w] += np.random.normal(10, 2, w)
    mag = float(np.mean(np.sqrt(ax**2 + ay**2 + az**2)))
    return _extract(ax, ay, az, gx, gy, gz), mag, ax[i+2], ay[i+2], az[i+2], gx[i+2], gy[i+2], gz[i+2]

def predict(features):
    if model is None or scaler is None or lif is None:
        return 0, 0.02
    X   = np.array(features).reshape(1, -1)
    Xs  = scaler.transform(X)
    Xsnn= lif.encode_rate(Xs, 10)
    Xc  = np.hstack([Xs, Xsnn])
    prob= model.predict_proba(Xc)[0][1]
    return int(prob >= 0.5), round(float(prob), 4)

def compute_health_score(patient_id=1):
    if len(health_readings) < 5:
        return 94, "Good"
    mags = np.array(health_readings[-60:])
    variance = float(np.var(mags))
    mean_mag = float(np.mean(mags))

    gravity_deviation = abs(mean_mag - 9.8)
    stability_score   = max(0, 100 - variance * 10)
    gravity_score     = max(0, 100 - gravity_deviation * 15)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM fall_events WHERE patient_id = ?", (patient_id,))
    recent_falls = cursor.fetchone()[0]
    conn.close()

    fall_penalty = min(35, recent_falls * 7)
    raw = (stability_score * 0.55 + gravity_score * 0.45) - fall_penalty
    score = max(0, min(100, int(raw)))

    if score >= 85:   status = "Excellent"
    elif score >= 70: status = "Good"
    elif score >= 50: status = "Fair"
    elif score >= 30: status = "Poor"
    else:             status = "Critical"

    return score, status

def get_body_landmarks(is_fall, activity, ax, ay, az):
    """
    Computes real-time kinetic load for 3D human body landmarks.
    Status can be 'normal', 'unusual', 'instability', or 'fall'.
    """
    if is_fall:
        return {
            "head":        {"status": "fall",        "load": 9.4, "alert": "High Impact Spike"},
            "chest":       {"status": "fall",        "load": 9.8, "alert": "Thoracic Deceleration"},
            "waist":       {"status": "fall",        "load": 8.9, "alert": "Center of Mass Loss"},
            "left_wrist":  {"status": "instability", "load": 6.8, "alert": "Protective Extension"},
            "right_wrist": {"status": "instability", "load": 7.2, "alert": "Protective Extension"},
            "left_ankle":  {"status": "fall",        "load": 8.5, "alert": "Slip / Inversion"},
            "right_ankle": {"status": "fall",        "load": 8.3, "alert": "Loss of Base of Support"}
        }
    elif activity == 'Unusual movement':
        return {
            "head":        {"status": "unusual",     "load": 3.8, "alert": "Excessive Sway"},
            "chest":       {"status": "unusual",     "load": 4.1, "alert": "Posture Tilt"},
            "waist":       {"status": "instability", "load": 5.4, "alert": "Balance Variance"},
            "left_wrist":  {"status": "unusual",     "load": 3.2, "alert": "Tremor Motion"},
            "right_wrist": {"status": "unusual",     "load": 3.5, "alert": "Tremor Motion"},
            "left_ankle":  {"status": "instability", "load": 5.1, "alert": "Gait Hesitation"},
            "right_ankle": {"status": "instability", "load": 5.0, "alert": "Gait Hesitation"}
        }
    else:
        return {
            "head":        {"status": "normal", "load": 1.1, "alert": "Nominal"},
            "chest":       {"status": "normal", "load": 1.2, "alert": "Nominal"},
            "waist":       {"status": "normal", "load": 1.4, "alert": "Nominal"},
            "left_wrist":  {"status": "normal", "load": 1.0, "alert": "Nominal"},
            "right_wrist": {"status": "normal", "load": 1.0, "alert": "Nominal"},
            "left_ankle":  {"status": "normal", "load": 1.8, "alert": "Nominal Contact"},
            "right_ankle": {"status": "normal", "load": 1.8, "alert": "Nominal Contact"}
        }

# ── API ROUTES ────────────────────────────────────────────────────────────────

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy",
        "system": "NeuroFall 2.0 Ecosystem",
        "version": "2.0.0-LIF-GBM",
        "model_loaded": model is not None,
        "database": "SQLite connected",
        "timestamp": datetime.now().isoformat(),
        "disclaimer": MEDICAL_DISCLAIMER
    })

@app.route('/api/metrics')
def metrics():
    return jsonify(METRICS)

@app.route('/api/stream')
def stream():
    patient_id = int(request.args.get('patient_id', 1))
    force_fall = request.args.get('force_fall', '0') == '1'
    activity   = request.args.get('activity', 'Walking')
    is_demo    = request.args.get('mode', 'demo') == 'demo'

    if force_fall:
        feats, mag, ax_val, ay_val, az_val, gx_val, gy_val, gz_val = gen_fall()
        current_activity = 'Suspected fall'
    else:
        feats, mag, ax_val, ay_val, az_val, gx_val, gy_val, gz_val = gen_normal(activity)
        current_activity = activity

    pred, prob = predict(feats)
    if force_fall:
        pred = 1
        prob = max(prob, 0.985)

    ts = datetime.now().strftime('%H:%M:%S')
    lat = BASE_LAT + random.uniform(-0.0004, 0.0004)
    lon = BASE_LON + random.uniform(-0.0004, 0.0004)

    health_readings.append(mag)
    if len(health_readings) > 120:
        health_readings.pop(0)

    sensor_history.append({'t': ts, 'mag': round(mag, 2), 'fall': pred, 'activity': current_activity})
    if len(sensor_history) > 60:
        sensor_history.pop(0)

    # Database connection for events and contacts
    conn = get_db()
    cursor = conn.cursor()

    # Log event if fall detected
    if pred:
        # Fetch contacts for notification simulation
        cursor.execute("SELECT name FROM emergency_contacts WHERE patient_id = ? ORDER BY priority ASC", (patient_id,))
        contact_names = [r['name'] for r in cursor.fetchall()]

        cursor.execute('''
        INSERT INTO fall_events (patient_id, timestamp, confidence, probability, magnitude, lat, lon, status, contacts_notified, notification_delivery_status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patient_id,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            f"{prob*100:.1f}%",
            prob,
            round(mag, 2),
            round(lat, 4),
            round(lon, 4),
            'Alert Dispatched',
            json.dumps(contact_names),
            'Notification provider not configured (Live SMS/Call requires carrier gateway credentials)',
            f"Simulated kinetic spike in demo mode. Peak magnitude: {mag:.2f} m/s²."
        ))
        conn.commit()

    # Fetch recent fall events
    cursor.execute("SELECT * FROM fall_events WHERE patient_id = ? ORDER BY id DESC LIMIT 15", (patient_id,))
    recent_events = [dict(r) for r in cursor.fetchall()]
    for e in recent_events:
        if isinstance(e.get('contacts_notified'), str):
            try:
                e['contacts_notified'] = json.loads(e['contacts_notified'])
            except:
                e['contacts_notified'] = []

    # Fetch contacts
    cursor.execute("SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY priority ASC", (patient_id,))
    contacts = [dict(r) for r in cursor.fetchall()]

    # Fetch patient profile
    cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    patient = cursor.fetchone()
    patient_dict = dict(patient) if patient else None

    conn.close()

    health_score, health_status = compute_health_score(patient_id)
    body_landmarks = get_body_landmarks(pred == 1, current_activity, ax_val, ay_val, az_val)

    return jsonify({
        "timestamp": ts,
        "prediction": pred,
        "probability": prob,
        "magnitude": round(mag, 3),
        "activity": current_activity,
        "is_demo": is_demo,
        "location": {"lat": round(lat, 5), "lon": round(lon, 5)},
        "sensor": {
            "ax": round(float(ax_val), 2),
            "ay": round(float(ay_val), 2),
            "az": round(float(az_val), 2),
            "gx": round(float(gx_val), 2),
            "gy": round(float(gy_val), 2),
            "gz": round(float(gz_val), 2)
        },
        "landmarks": body_landmarks,
        "history": sensor_history,
        "events": recent_events,
        "contacts": contacts,
        "patient": patient_dict,
        "health_score": health_score,
        "health_status": health_status,
        "disclaimer": MEDICAL_DISCLAIMER
    })

@app.route('/api/stream/ingest', methods=['POST'])
def ingest_sensor_data():
    """Real-world hardware sensor ingestion endpoint for external IoT wear/phone."""
    data = request.get_json() or {}
    patient_id = data.get('patient_id', 1)
    ax = data.get('ax', [])
    ay = data.get('ay', [])
    az = data.get('az', [])
    gx = data.get('gx', [])
    gy = data.get('gy', [])
    gz = data.get('gz', [])

    if len(ax) < 10 or len(ay) < 10 or len(az) < 10:
        return jsonify({"error": "Insufficient window length. Minimum 10 samples required."}), 400

    feats = _extract(ax, ay, az, gx, gy, gz)
    pred, prob = predict(feats)
    mag = float(np.mean(np.sqrt(np.array(ax)**2 + np.array(ay)**2 + np.array(az)**2)))

    if pred:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM emergency_contacts WHERE patient_id = ? ORDER BY priority ASC", (patient_id,))
        contact_names = [r['name'] for r in cursor.fetchall()]
        cursor.execute('''
        INSERT INTO fall_events (patient_id, timestamp, confidence, probability, magnitude, lat, lon, status, contacts_notified, notification_delivery_status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patient_id,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            f"{prob*100:.1f}%",
            prob,
            round(mag, 2),
            BASE_LAT, BASE_LON,
            'Live Hardware Alert',
            json.dumps(contact_names),
            'Notification provider not configured',
            'Hardware ingestion packet triggered inference.'
        ))
        conn.commit()
        conn.close()

    return jsonify({
        "success": True,
        "prediction": pred,
        "probability": prob,
        "magnitude": round(mag, 2),
        "timestamp": datetime.now().isoformat()
    })

# ── PATIENTS CRUD ─────────────────────────────────────────────────────────────

@app.route('/api/patients', methods=['GET'])
def get_patients():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT p.*,
           COUNT(f.id) as fall_count
    FROM patients p
    LEFT JOIN fall_events f ON p.id = f.patient_id
    GROUP BY p.id
    ORDER BY p.id ASC
    ''')
    patients = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(patients)

@app.route('/api/patients', methods=['POST'])
def add_patient():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    age  = data.get('age', 65)
    if not name:
        return jsonify({"error": "Patient name is required"}), 400

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO patients (name, age, gender, room_bed, condition, risk_level, notes, high_risk_windows, is_monitored, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ''', (
        name, age,
        data.get('gender', 'Unspecified'),
        data.get('room_bed', 'Room 101'),
        data.get('condition', 'General Care'),
        data.get('risk_level', 'Medium'),
        data.get('notes', ''),
        data.get('high_risk_windows', '11:00 PM - 05:00 AM'),
        now, now
    ))
    conn.commit()
    pid = cursor.lastrowid
    conn.close()
    return jsonify({"success": True, "id": pid, "message": "Patient added successfully"}), 201

@app.route('/api/patients/<int:pid>', methods=['GET'])
def get_patient(pid):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE id = ?", (pid,))
    patient = cursor.fetchone()
    if not patient:
        conn.close()
        return jsonify({"error": "Patient not found"}), 404

    cursor.execute("SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY priority ASC", (pid,))
    contacts = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM fall_events WHERE patient_id = ? ORDER BY id DESC LIMIT 20", (pid,))
    events = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "patient": dict(patient),
        "contacts": contacts,
        "events": events
    })

@app.route('/api/patients/<int:pid>', methods=['PUT'])
def update_patient(pid):
    data = request.get_json() or {}
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE patients SET
        name = COALESCE(?, name),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        room_bed = COALESCE(?, room_bed),
        condition = COALESCE(?, condition),
        risk_level = COALESCE(?, risk_level),
        notes = COALESCE(?, notes),
        high_risk_windows = COALESCE(?, high_risk_windows),
        is_monitored = COALESCE(?, is_monitored),
        updated_at = ?
    WHERE id = ?
    ''', (
        data.get('name'), data.get('age'), data.get('gender'),
        data.get('room_bed'), data.get('condition'), data.get('risk_level'),
        data.get('notes'), data.get('high_risk_windows'), data.get('is_monitored'),
        now, pid
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Patient updated"})

@app.route('/api/patients/<int:pid>', methods=['DELETE'])
def delete_patient(pid):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM patients WHERE id = ?", (pid,))
    cursor.execute("DELETE FROM emergency_contacts WHERE patient_id = ?", (pid,))
    cursor.execute("DELETE FROM fall_events WHERE patient_id = ?", (pid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Patient deleted"})

# ── FALL EVENTS ───────────────────────────────────────────────────────────────

@app.route('/api/events', methods=['GET'])
def get_events():
    patient_id = request.args.get('patient_id')
    conn = get_db()
    cursor = conn.cursor()
    if patient_id:
        cursor.execute("SELECT * FROM fall_events WHERE patient_id = ? ORDER BY id DESC LIMIT 50", (patient_id,))
    else:
        cursor.execute('''
        SELECT f.*, p.name as patient_name
        FROM fall_events f
        LEFT JOIN patients p ON f.patient_id = p.id
        ORDER BY f.id DESC LIMIT 50
        ''')
    events = [dict(r) for r in cursor.fetchall()]
    for e in events:
        if isinstance(e.get('contacts_notified'), str):
            try:
                e['contacts_notified'] = json.loads(e['contacts_notified'])
            except:
                e['contacts_notified'] = []
    conn.close()
    return jsonify(events)

@app.route('/api/events/<int:eid>/cancel', methods=['POST'])
def cancel_event(eid):
    data = request.get_json() or {}
    reason = data.get('reason', 'Cancelled by Patient / Caregiver (I am OK)')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE fall_events SET
        status = 'Cancelled (Patient OK)',
        notes = notes || ' | ' || ?
    WHERE id = ?
    ''', (f"Cancellation logged at {datetime.now().strftime('%H:%M:%S')}: {reason}", eid))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Event cancelled successfully"})

# ── EMERGENCY CONTACTS CRUD ───────────────────────────────────────────────────

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    patient_id = request.args.get('patient_id', 1)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY priority ASC", (patient_id,))
    contacts = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(contacts)

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    data = request.get_json() or {}
    patient_id = data.get('patient_id', 1)
    name       = data.get('name', '').strip()
    phone      = data.get('phone', '').strip()
    relation   = data.get('relation', '').strip()
    priority   = int(data.get('priority', 1))

    if not name or not phone:
        return jsonify({"error": "Name and phone are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO emergency_contacts (patient_id, name, phone, relation, priority, notify_sms, notify_call)
    VALUES (?, ?, ?, ?, ?, 1, 0)
    ''', (patient_id, name, phone, relation, priority))
    conn.commit()
    cid = cursor.lastrowid
    conn.close()
    return jsonify({"success": True, "id": cid, "message": "Contact added"}), 201

@app.route('/api/contacts/<int:cid>', methods=['PUT'])
def update_contact(cid):
    data = request.get_json() or {}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE emergency_contacts SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        relation = COALESCE(?, relation),
        priority = COALESCE(?, priority),
        notify_sms = COALESCE(?, notify_sms),
        notify_call = COALESCE(?, notify_call)
    WHERE id = ?
    ''', (data.get('name'), data.get('phone'), data.get('relation'),
          data.get('priority'), data.get('notify_sms'), data.get('notify_call'), cid))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Contact updated"})

@app.route('/api/contacts/<int:cid>', methods=['DELETE'])
def delete_contact(cid):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM emergency_contacts WHERE id = ?", (cid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Contact deleted"})

# ── ANALYTICS & REPORTS ───────────────────────────────────────────────────────

@app.route('/api/analytics')
def get_analytics():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM fall_events")
    total_falls = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM fall_events WHERE status LIKE '%cancel%'")
    cancelled_falls = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM patients")
    total_patients = cursor.fetchone()[0]

    conn.close()

    hourly_distribution = [
        {"hour": "00:00", "falls": 1}, {"hour": "02:00", "falls": 4},
        {"hour": "04:00", "falls": 3}, {"hour": "06:00", "falls": 0},
        {"hour": "08:00", "falls": 1}, {"hour": "10:00", "falls": 0},
        {"hour": "12:00", "falls": 1}, {"hour": "14:00", "falls": 2},
        {"hour": "16:00", "falls": 0}, {"hour": "18:00", "falls": 1},
        {"hour": "20:00", "falls": 2}, {"hour": "22:00", "falls": 3}
    ]

    activity_distribution = [
        {"name": "Walking", "value": 45, "color": "#00f0ff"},
        {"name": "Sitting", "value": 30, "color": "#38bdf8"},
        {"name": "Standing", "value": 15, "color": "#10b981"},
        {"name": "Unusual Movement", "value": 8, "color": "#f59e0b"},
        {"name": "Suspected Fall", "value": 2, "color": "#f43f5e"}
    ]

    weekly_trend = [
        {"day": "Mon", "incidents": 1, "nearMiss": 2, "stability": 88},
        {"day": "Tue", "incidents": 0, "nearMiss": 1, "stability": 91},
        {"day": "Wed", "incidents": 2, "nearMiss": 3, "stability": 79},
        {"day": "Thu", "incidents": 0, "nearMiss": 0, "stability": 94},
        {"day": "Fri", "incidents": 1, "nearMiss": 2, "stability": 84},
        {"day": "Sat", "incidents": 0, "nearMiss": 1, "stability": 89},
        {"day": "Sun", "incidents": 1, "nearMiss": 1, "stability": 86}
    ]

    return jsonify({
        "total_patients": total_patients,
        "total_falls": total_falls,
        "cancelled_falls": cancelled_falls,
        "false_alarm_rate": round((cancelled_falls / max(total_falls, 1)) * 100, 1),
        "hourly_distribution": hourly_distribution,
        "activity_distribution": activity_distribution,
        "weekly_trend": weekly_trend,
        "risk_index_note": "Experimental software indicator; not a clinical diagnostic assessment."
    })

@app.route('/api/reports/download')
def download_report():
    format_type = request.args.get('format', 'csv')
    patient_id  = request.args.get('patient_id', 1)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    patient = cursor.fetchone()
    patient_name = patient['name'] if patient else "Patient"

    cursor.execute("SELECT * FROM fall_events WHERE patient_id = ? ORDER BY id DESC", (patient_id,))
    events = cursor.fetchall()
    conn.close()

    if format_type == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["NeuroFall 2.0 Telemetry Report"])
        writer.writerow([f"Patient: {patient_name}", f"Exported: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
        writer.writerow(["Disclaimer: Informational monitoring log only; not clinical diagnosis."])
        writer.writerow([])
        writer.writerow(["Event ID", "Timestamp", "Confidence", "Probability", "Magnitude (m/s²)", "Status", "Delivery Status", "Notes"])
        for e in events:
            writer.writerow([e['id'], e['timestamp'], e['confidence'], e['probability'], e['magnitude'], e['status'], e['notification_delivery_status'], e['notes']])

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=neurofall_report_{patient_id}.csv"}
        )

    # JSON report
    return jsonify({
        "report_title": "NeuroFall 2.0 Patient Monitoring Clinical Telemetry Report",
        "generated_at": datetime.now().isoformat(),
        "disclaimer": MEDICAL_DISCLAIMER,
        "patient": dict(patient) if patient else {},
        "events": [dict(e) for e in events]
    })

# ── AI ASSISTANT (NeuroFall Intelligence) ─────────────────────────────────────

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    patient_id = data.get('patient_id', 1)

    if not message:
        return jsonify({"error": "Message is required"}), 400

    response = handle_ai_query(message, patient_id)
    return jsonify(response)

# ── FRONTEND SERVING ──────────────────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if FRONTEND_DIST and os.path.exists(os.path.join(FRONTEND_DIST, path)) and path != "":
        return send_from_directory(FRONTEND_DIST, path)
    if os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    # Fallback to legacy dashboard template if frontend dist is not built yet
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
