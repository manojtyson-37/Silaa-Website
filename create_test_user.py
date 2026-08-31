import psycopg2
import os
import hashlib

url = 'postgresql+psycopg2://postgres.nxwiyupkznedqknwquhc:Mymoney%401997%40@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'
url = url.replace('postgresql+psycopg2://', 'postgresql://')

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return f"{salt.hex()}:{pw_hash.hex()}"

conn = psycopg2.connect(url)
cur = conn.cursor()

try:
    # See if user already exists
    cur.execute("SELECT id FROM users WHERE username = 'test_agent'")
    user = cur.fetchone()
    if user:
        print("test_agent already exists")
    else:
        pw_hash = hash_password('test_agent_password')
        cur.execute("""
            INSERT INTO users (username, password_hash, role, is_active)
            VALUES ('test_agent', %s, 'admin', True)
        """, (pw_hash,))
        conn.commit()
        print("Created test_agent user with password: test_agent_password")
except Exception as e:
    conn.rollback()
    print("Error:", e)
finally:
    cur.close()
    conn.close()
