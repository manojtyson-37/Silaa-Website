import psycopg2
import os

url = 'postgresql+psycopg2://postgres.nxwiyupkznedqknwquhc:Mymoney%401997%40@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'
url = url.replace('postgresql+psycopg2://', 'postgresql://')

conn = psycopg2.connect(url)
cur = conn.cursor()

try:
    # 1. Insert into proforma_invoice
    cur.execute("""
        INSERT INTO proforma_invoice (
            id, invoice_number, customer_name, customer_phone, customer_email,
            customer_address, customer_gstin, customer_state, delivery_date,
            description, advance_percent, status
        ) VALUES (
            1, 'PI-0001', 'NAMRATA VIVEK MAKWANA', '9916100151', '',
            'No.Block 5, 555,63rd Cross Road, Rajaji Naga, Bengaluru, Karnataka - 560010',
            '29AKMPC7982K1ZE', 'Karnataka', '2026-08-05',
            '50% on delivery', 50.00, 'sent'
        )
    """)
    print("Inserted PI-0001")
    
    # 2. Insert into proforma_invoice_line
    # Base price: 8820, Total qty: 49 => Unit price: 180.00
    # Let's put sizes {"S": 49}
    import json
    sizes_json = json.dumps({"S": 49})
    cur.execute("""
        INSERT INTO proforma_invoice_line (
            proforma_id, style_name, description, photo_url, unit_price,
            gst_percent, sizes, total_qty
        ) VALUES (
            1, 'Slub Poly M130 Cheff Coat', '', '', 180.00,
            5.00, %s, 49
        )
    """, (sizes_json,))
    print("Inserted PI-0001 lines")
    
    conn.commit()
    print("Restore successful!")
except Exception as e:
    conn.rollback()
    print("Error:", e)
finally:
    cur.close()
    conn.close()
