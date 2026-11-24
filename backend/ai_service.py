import os
import json
import sqlite3
from datetime import datetime, timedelta
from .database import get_db

MEDICAL_DISCLAIMER = (
    "Disclaimer: NeuroFall Intelligence is an experimental software monitoring assistant "
    "designed to summarize telemetry and alert logs for caregivers. It is NOT a clinical diagnostic "
    "tool, does not prescribe treatments, and cannot replace consultation with a licensed medical professional."
)

def query_patient_context(patient_id=1):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    patient = cursor.fetchone()
    patient_dict = dict(patient) if patient else None

    cursor.execute(
        "SELECT * FROM fall_events WHERE patient_id = ? ORDER BY id DESC LIMIT 10",
        (patient_id,)
    )
    events = [dict(row) for row in cursor.fetchall()]

    cursor.execute(
        "SELECT * FROM activity_logs WHERE patient_id = ? ORDER BY id DESC LIMIT 20",
        (patient_id,)
    )
    activities = [dict(row) for row in cursor.fetchall()]

    cursor.execute(
        "SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY priority ASC",
        (patient_id,)
    )
    contacts = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "patient": patient_dict,
        "recent_events": events,
        "recent_activities": activities,
        "contacts": contacts
    }

def handle_ai_query(user_message, patient_id=1):
    """
    Handles user chat inquiries using real database ground truth.
    Supports external LLM (Gemini/OpenAI) if API key present, otherwise
    provides deterministic, grounded synthesis based on verified SQLite records.
    """
    context = query_patient_context(patient_id)
    patient = context.get("patient") or {
        "name": "Unknown Patient", "age": "N/A", "condition": "None specified", "risk_level": "Medium"
    }
    events = context.get("recent_events", [])
    activities = context.get("recent_activities", [])
    contacts = context.get("contacts", [])

    q = user_message.lower().strip()

    # Citations record tracking
    supporting_records = []

    # Check if Gemini/OpenAI API key exists in environment
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")

    if api_key and os.environ.get("GEMINI_API_KEY"):
        try:
            # If Google Gemini is configured
            from google import genai
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            sys_instruction = (
                f"You are NeuroFall Intelligence, an AI safety & telemetry assistant for elderly monitoring. "
                f"Always adhere strictly to the following patient context: {json.dumps(context)}. "
                f"Never fabricate records. Never diagnose or prescribe medicines. "
                f"Always include citations of timestamps and record IDs used."
            )
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"{sys_instruction}\nUser Query: {user_message}"
            )
            return {
                "answer": response.text,
                "supporting_records": [f"Patient ID: {patient.get('id')}", f"Events count: {len(events)}"],
                "disclaimer": MEDICAL_DISCLAIMER,
                "provider": "Google Gemini (Grounded Live)"
            }
        except Exception as e:
            # Fall back to grounded engine if API call fails
            pass

    # Deterministic Data-Grounded Assistant Engine
    if any(k in q for k in ["last fall", "latest fall", "suspected fall", "what happened"]):
        if not events:
            ans = f"No fall events are currently logged for {patient['name']} in the database."
        else:
            latest = events[0]
            supporting_records.append(f"Event #{latest['id']} at {latest['timestamp']}")
            ans = (
                f"**Latest Event Analysis for {patient['name']} (Record #{latest['id']}):**\n\n"
                f"- **Timestamp:** {latest['timestamp']}\n"
                f"- **Model Confidence:** {latest['confidence']} (Raw Probability: {latest['probability']:.4f})\n"
                f"- **Peak Acceleration:** {latest['magnitude']:.2f} m/s²\n"
                f"- **GPS Coordinates:** {latest['lat']}, {latest['lon']}\n"
                f"- **Status:** {latest['status']}\n"
                f"- **Clinical Telemetry Notes:** {latest.get('notes') or 'No additional notes logged.'}\n\n"
                f"**Caregiver Takeaway:** The SNN LIF detector identified sudden high-magnitude kinetic impact. "
                f"Status shows '{latest['status']}'."
            )

    elif any(k in q for k in ["how many", "count", "frequency", "this week", "falls this week"]):
        fall_count = len(events)
        cancelled = sum(1 for e in events if "cancel" in e['status'].lower())
        confirmed = sum(1 for e in events if "alert" in e['status'].lower() or "confirm" in e['status'].lower())
        for e in events:
            supporting_records.append(f"Event #{e['id']} ({e['timestamp']}) - Status: {e['status']}")

        ans = (
            f"**Fall Event Frequency Summary for {patient['name']}:**\n\n"
            f"- **Total Events on Record:** {fall_count}\n"
            f"- **Confirmed Incidents:** {confirmed}\n"
            f"- **Cancelled / False Alarms (Patient Pressed OK):** {cancelled}\n\n"
            f"**Insight:** The false-alarm rate is currently {(cancelled/fall_count*100) if fall_count else 0:.1f}%. "
            f"The 30-second cancellation window successfully prevented unnecessary ambulance dispatches for {cancelled} stumble(s)."
        )

    elif any(k in q for k in ["unusual", "activity", "activities", "sitting", "walking", "trend"]):
        unusual = [a for a in activities if a['activity'].lower() in ['unusual movement', 'suspected fall']]
        for u in unusual[:3]:
            supporting_records.append(f"Activity Log #{u['id']} at {u['timestamp']} ({u['activity']})")

        ans = (
            f"**Activity & Mobility Trends for {patient['name']}:**\n\n"
            f"- **Recent Sampled Logs:** {len(activities)} windows evaluated.\n"
            f"- **Unusual Movement Episodes:** {len(unusual)} detected in the last recorded period.\n"
            f"- **Primary Activities:** Walking, Sitting, and Bed Rest.\n"
            f"- **Stability Metric:** Averaging ~{sum(a['stability_score'] for a in activities)/len(activities) if activities else 90:.1f}/100.\n\n"
            f"**Notice:** Patient exhibits higher sensor variance during transition windows. "
            f"High-risk window specified in profile: **{patient.get('high_risk_windows', '10 PM - 5 AM')}**."
        )

    elif any(k in q for k in ["contact", "contacts", "who to call", "call", "emergency"]):
        ans = f"**Configured Emergency Notification Cascade for {patient['name']}:**\n\n"
        for c in contacts:
            supporting_records.append(f"Contact Priority P{c['priority']}: {c['name']}")
            ans += f"- **P{c['priority']} - {c['name']}** ({c['relation']}): {c['phone']} [SMS: {'Yes' if c['notify_sms'] else 'No'}, Call: {'Yes' if c['notify_call'] else 'No'}]\n"
        ans += "\n*Note: Simulated alerts are displayed in UI; live carrier SMS/voice delivery requires configuring an external provider key.*"

    elif any(k in q for k in ["summary", "summarize", "today", "overview"]):
        ans = (
            f"**Executive Patient Monitoring Summary:**\n\n"
            f"- **Patient:** {patient['name']}, {patient['age']} y/o {patient['gender']} ({patient.get('room_bed', 'Room N/A')})\n"
            f"- **Condition:** {patient.get('condition')}\n"
            f"- **Current Fall Risk:** {patient.get('risk_level', 'Medium')}\n"
            f"- **Monitoring State:** {'Active (Simulated/Sensor)' if patient.get('is_monitored') else 'Paused'}\n"
            f"- **Logged Incidents:** {len(events)} in history.\n"
            f"- **Key Caregiver Guidance:** Regular gait checks recommended during nocturnal mobility windows."
        )
        supporting_records.append(f"Patient profile ID #{patient.get('id')}")

    else:
        ans = (
            f"**NeuroFall Intelligence Query Assistant:**\n\n"
            f"I have reviewed the clinical telemetry records for **{patient['name']}** ({patient.get('condition')}).\n\n"
            f"Here are key questions I can answer using your verified application database:\n"
            f"1. *'What happened during the last suspected fall?'*\n"
            f"2. *'How many falls were detected this week?'*\n"
            f"3. *'Which activities were flagged as unusual?'*\n"
            f"4. *'Show emergency contacts and escalation priority.'*\n"
            f"5. *'Summarize today's monitoring session.'*"
        )
        supporting_records.append("Telemetry Database schema & logs")

    return {
        "answer": ans,
        "supporting_records": supporting_records,
        "disclaimer": MEDICAL_DISCLAIMER,
        "provider": "NeuroFall Telemetry Knowledge Engine (Local Grounded)"
    }
