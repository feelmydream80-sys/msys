from flask import Flask
from msys.database import get_db_connection

app = Flask(__name__)

with app.app_context():
    with get_db_connection() as db:
        with db.cursor() as cur:
            cur.execute("SELECT grp_id, memo_date, depth, content, writer_id, created_at FROM TB_GRP_MEMO ORDER BY created_at DESC LIMIT 10")
            results = cur.fetchall()
            
            print("=== Memo Data from DB ===")
            for row in results:
                print(f"grp_id: {row[0]}, memo_date: {row[1]}, writer_id: {row[4]}, created_at: {row[5]}")