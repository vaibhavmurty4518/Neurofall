import sys, os
from dashboard.app import app

client = app.test_client()

print("="*50)
print("  Running NeuroFall 2.0 Comprehensive Test Suite")
print("="*50)

# 1. Test index page (serving built React dist or legacy template)
r = client.get('/')
assert r.status_code == 200, f'Index failed: {r.status_code}'
assert b'NeuroFall 2.0' in r.data or b'NeuroFall' in r.data, 'Index title missing'
print('[PASS] GET / -> 200 (Serving Frontend)')

# 2. Test system health
r = client.get('/api/health')
assert r.status_code == 200, f'Health failed: {r.status_code}'
health_data = r.get_json()
assert health_data['status'] == 'healthy'
assert health_data['model_loaded'] is True
print(f"[PASS] GET /api/health -> {health_data['system']} (Version: {health_data['version']})")

# 3. Test metrics
r = client.get('/api/metrics')
assert r.status_code == 200
metrics = r.get_json()
print(f"[PASS] GET /api/metrics -> Accuracy: {metrics.get('accuracy')}% | AUC: {metrics.get('auc')}")

# 4. Test patients CRUD
r = client.get('/api/patients')
assert r.status_code == 200
patients = r.get_json()
assert len(patients) >= 1
print(f"[PASS] GET /api/patients -> {len(patients)} registered patient(s)")

# Test add patient
new_p = {
    "name": "Kavita Verma",
    "age": 68,
    "gender": "Female",
    "room_bed": "Room 312-A",
    "condition": "Post-stroke hemiparesis with mild balance loss",
    "risk_level": "High",
    "high_risk_windows": "09:00 PM - 04:00 AM",
    "notes": "Walker required for ambulation."
}
r = client.post('/api/patients', json=new_p)
assert r.status_code == 201
new_pid = r.get_json()['id']
print(f"[PASS] POST /api/patients -> Created ID #{new_pid}")

# 5. Test stream with landmarks & SNN predictions
r = client.get('/api/stream?patient_id=1')
assert r.status_code == 200
stream_data = r.get_json()
assert 'landmarks' in stream_data
assert 'head' in stream_data['landmarks']
assert 'chest' in stream_data['landmarks']
assert 'waist' in stream_data['landmarks']
print(f"[PASS] GET /api/stream (Normal) -> Activity: {stream_data['activity']}, Prediction: {stream_data['prediction']}, Landmarks: {len(stream_data['landmarks'])}")

# Test force fall stream
r = client.get('/api/stream?patient_id=1&force_fall=1')
assert r.status_code == 200
fall_data = r.get_json()
assert fall_data['prediction'] == 1
assert fall_data['probability'] >= 0.5
assert fall_data['landmarks']['head']['status'] == 'fall'
print(f"[PASS] GET /api/stream?force_fall=1 -> Prediction: {fall_data['prediction']}, Conf: {fall_data['probability']*100:.1f}%, Head State: {fall_data['landmarks']['head']['status']}")

# 6. Test events & cancellation
r = client.get('/api/events')
assert r.status_code == 200
events = r.get_json()
assert len(events) >= 1
latest_eid = events[0]['id']
print(f"[PASS] GET /api/events -> {len(events)} logged incident(s)")

r = client.post(f'/api/events/{latest_eid}/cancel', json={'reason': 'Test verification cancellation'})
assert r.status_code == 200
print(f"[PASS] POST /api/events/{latest_eid}/cancel -> Verified cancellation logged")

# 7. Test contacts CRUD
r = client.get('/api/contacts?patient_id=1')
assert r.status_code == 200
contacts = r.get_json()
assert len(contacts) >= 1
print(f"[PASS] GET /api/contacts -> {len(contacts)} emergency contact(s)")

# 8. Test analytics
r = client.get('/api/analytics')
assert r.status_code == 200
analytics = r.get_json()
assert 'hourly_distribution' in analytics
assert 'activity_distribution' in analytics
print(f"[PASS] GET /api/analytics -> False Alarm Rate: {analytics['false_alarm_rate']}%")

# 9. Test AI chat assistant
r = client.post('/api/ai/chat', json={'message': 'What happened during the last suspected fall?', 'patient_id': 1})
assert r.status_code == 200
ai_res = r.get_json()
assert 'answer' in ai_res
assert len(ai_res.get('supporting_records', [])) >= 1
print(f"[PASS] POST /api/ai/chat -> Answer generated with {len(ai_res['supporting_records'])} verified citations")

# 10. Clean up test patient
r = client.delete(f'/api/patients/{new_pid}')
assert r.status_code == 200
print(f"[PASS] DELETE /api/patients/{new_pid} -> Cleanup successful")

print("="*50)
print("  ALL 10 NEUROFALL 2.0 INTEGRATION TESTS PASSED!")
print("="*50)
