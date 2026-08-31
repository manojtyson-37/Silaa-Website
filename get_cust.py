import json, base64, hashlib, hmac, time, subprocess

SECRET_KEY = 'fzqgeujv7qD-U-X-1pgh2abOunvAgvZIvrv68Leh40g'
payload = {'sub': 'admin', 'role': 'admin', 'exp': int(time.time()) + 43200}
payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
token = f"{payload_b64}.{base64.urlsafe_b64encode(sig).rstrip(b'=').decode()}"

r = subprocess.run(['curl', '-s', 'https://silaa-website.vercel.app/api/erp/customers', '-H', f'Authorization: Bearer {token}'], capture_output=True, text=True)
custs = json.loads(r.stdout)
for c in custs:
    if 'NAMRATA' in c.get('name', '').upper():
        print(c)
