import sys, os
from dashboard.app import app

client = app.test_client()

# 1. Test index page
r = client.get('/')
assert r.status_code == 200, f'Index failed: {r.status_code}'
print('[PASS] GET / -> 200')

# 2. Test metrics
r = client.get('/api/metrics')
assert r.status_code == 200, f'Metrics failed: {r.status_code}'
print('[PASS] GET /api/metrics ->', r.get_json())

# 3. Test normal stream
r = client.get('/api/stream')
assert r.status_code == 200
data = r.get_json()
assert 'prediction' in data and 'probability' in data and 'health_score' in data
print(f"[PASS] GET /api/stream -> prediction={data['prediction']}, prob={data['probability']}, health={data['health_score']}")

# 4. Test forced fall
r = client.get('/api/stream?force_fall=1')
assert r.status_code == 200
data = r.get_json()
assert data['prediction'] == 1
print(f"[PASS] GET /api/stream?force_fall=1 -> prediction={data['prediction']}, prob={data['probability']}, events={len(data['events'])}")

# 5. Test contacts CRUD
r = client.post('/api/contacts', json={'name': 'Emergency Contact 1', 'phone': '+91 9999999999', 'relation': 'Son'})
assert r.status_code == 201
cid = r.get_json()['contact']['id']
print(f"[PASS] POST /api/contacts -> id={cid}")

r = client.get('/api/contacts')
assert r.status_code == 200
assert len(r.get_json()) == 1
print('[PASS] GET /api/contacts -> 1 contact')

r = client.delete(f'/api/contacts/{cid}')
assert r.status_code == 200
print('[PASS] DELETE /api/contacts -> deleted')

# 6. Test health endpoint
r = client.get('/api/health')
assert r.status_code == 200
print('[PASS] GET /api/health ->', r.get_json()['status'])
print('ALL TESTS PASSED!')
