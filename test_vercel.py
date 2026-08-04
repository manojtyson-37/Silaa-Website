import urllib.request, json, urllib.error
try:
    req = urllib.request.Request("https://silaa-website.vercel.app/api/erp/auth/login", data=json.dumps({"username":"admin","password":"admin"}).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        token = json.loads(res.read())["access_token"]
    req2 = urllib.request.Request("https://silaa-website.vercel.app/api/erp/customers", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req2) as res2:
        customers = json.loads(res2.read())
        carts = [cart for c in customers for cart in c.get('abandoned_carts', [])]
        print(f"Total customers: {len(customers)}")
        print(f"Total abandoned carts: {len(carts)}")
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode()}")
