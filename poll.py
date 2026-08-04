import urllib.request, time

for i in range(30):
    try:
        req = urllib.request.Request("https://silaa-website.vercel.app/api/erp/customers")
        with urllib.request.urlopen(req) as response:
            if response.status != 401:
                print(f"Status changed to {response.status}!")
                print(response.read().decode('utf-8')[:1000])
                break
    except urllib.error.HTTPError as e:
        if e.code != 401:
            print(f"Status changed to {e.code}!")
            print(e.read().decode('utf-8')[:1000])
            break
    print("Waiting for deployment...")
    time.sleep(5)
