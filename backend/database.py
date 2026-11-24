import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'neurofall.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    # Patients table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT,
        room_bed TEXT,
        condition TEXT,
        risk_level TEXT DEFAULT 'Medium',
        notes TEXT,
        high_risk_windows TEXT,
        is_monitored INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
    )
    ''')

    # Emergency contacts
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relation TEXT,
        priority INTEGER DEFAULT 1,
        notify_sms INTEGER DEFAULT 1,
        notify_call INTEGER DEFAULT 0,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
    ''')

    # Fall events
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS fall_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        timestamp TEXT NOT NULL,
        confidence TEXT NOT NULL,
        probability REAL NOT NULL,
        magnitude REAL NOT NULL,
        lat REAL,
        lon REAL,
        status TEXT NOT NULL,
        contacts_notified TEXT,
        notification_delivery_status TEXT,
        notes TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    )
    ''')

    # Activity logs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        timestamp TEXT NOT NULL,
        activity TEXT NOT NULL,
        fall_prob REAL NOT NULL,
        stability_score REAL NOT NULL,
        gravity_deviation REAL NOT NULL,
        magnitude REAL NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
    ''')

    conn.commit()

    # Seed default patient if empty
    cursor.execute('SELECT COUNT(*) FROM patients')
    if cursor.fetchone()[0] == 0:
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
        INSERT INTO patients (name, age, gender, room_bed, condition, risk_level, notes, high_risk_windows, is_monitored, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        ''', (
            "Ramesh Kumar", 74, "Male", "Room 204-B",
            "Early-stage Parkinson's with resting tremors and mild gait instability",
            "High",
            "History of nocturnal mobility attempts. Needs walking support. Prescription: Levodopa 100mg.",
            "10:00 PM - 05:00 AM",
            now, now
        ))
        patient_id = cursor.lastrowid

        # Seed contacts
        contacts = [
            (patient_id, "Sunita Kumar", "+91 98765 43210", "Wife (Primary Caregiver)", 1, 1, 1),
            (patient_id, "Amit Kumar", "+91 98111 22334", "Son", 2, 1, 0),
            (patient_id, "Dr. Anjali Sharma", "+91 94250 88990", "Attending Neurologist", 3, 1, 0),
            (patient_id, "Apex Care Ambulance", "108", "Emergency Services", 4, 0, 1),
        ]
        cursor.executemany('''
        INSERT INTO emergency_contacts (patient_id, name, phone, relation, priority, notify_sms, notify_call)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', contacts)

        # Seed some initial realistic fall events for analytics and AI assistant
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d 14:32:05')
        two_days_ago = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d 02:18:40')
        events = [
            (patient_id, yesterday, "94.2%", 0.942, 14.85, 21.1904, 81.2849, "Cancelled (Patient OK)",
             json.dumps(["Sunita Kumar", "Amit Kumar"]), "Notification Provider Not Configured (Demo Mode)",
             "Patient stumbled near bed frame; recovered and hit cancel within 12 seconds."),
            (patient_id, two_days_ago, "96.8%", 0.968, 18.20, 21.1906, 81.2846, "Confirmed Alert",
             json.dumps(["Sunita Kumar", "Amit Kumar", "Dr. Anjali Sharma"]), "Notification Provider Not Configured (Demo Mode)",
             "Sudden fall in hallway at night. Caregiver attended within 4 minutes.")
        ]
        cursor.executemany('''
        INSERT INTO fall_events (patient_id, timestamp, confidence, probability, magnitude, lat, lon, status, contacts_notified, notification_delivery_status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', events)

        # Seed sample activity logs for analytics
        activities = ['Walking', 'Sitting', 'Standing', 'Lying down', 'Walking', 'Unusual movement', 'Sitting', 'Walking']
        for i in range(24):
            t = (datetime.now() - timedelta(hours=24 - i)).strftime('%Y-%m-%d %H:%M:%S')
            act = activities[i % len(activities)]
            prob = 0.85 if act == 'Unusual movement' else 0.02
            mag = 12.4 if act == 'Unusual movement' else (9.8 + (i % 3) * 0.2)
            cursor.execute('''
            INSERT INTO activity_logs (patient_id, timestamp, activity, fall_prob, stability_score, gravity_deviation, magnitude)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (patient_id, t, act, prob, 85 - (i % 10), 0.3, mag))

        conn.commit()

    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
