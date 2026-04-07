"""CD327 설정 동기화 테스트 스크립트"""
import sys
sys.path.insert(0, '.')

import psycopg2
from psycopg2.extras import RealDictCursor
from msys.config import config
import logging

logging.basicConfig(level=logging.DEBUG)

def get_direct_connection():
    """Flask 앱 컨텍스트 없이 직접 DB 연결"""
    db_config = config.DB_CONFIG.copy()
    db_config['client_encoding'] = 'UTF8'
    return psycopg2.connect(**db_config)

def test_cd327_sync():
    print("=" * 60)
    print("CD327 설정 동기화 테스트")
    print("=" * 60)
    
    conn = get_direct_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # 1. TB_MNGR_SETT에서 TB_API_KEY_MNGR에 없는 CD 조회 (NOT EXISTS)
    print("\n1. TB_API_KEY_MNGR에 없는 CD 목록:")
    cur.execute("""
        SELECT m.CD
        FROM TB_MNGR_SETT m
        WHERE NOT EXISTS (SELECT 1 FROM TB_API_KEY_MNGR a WHERE a.CD = m.CD)
    """)
    cds_not_in_api_key = cur.fetchall()
    print(f"   {len(cds_not_in_api_key)}개 발견:")
    for row in cds_not_in_api_key:
        print(f"   - {row['cd']}")
    
    # 2. CD327이 TB_CON_MST에 있는지 확인
    print("\n2. CD327 TB_CON_MST 조회:")
    cur.execute("SELECT * FROM TB_CON_MST WHERE CD = %s", ('CD327',))
    cd327_data = cur.fetchone()
    if cd327_data:
        print(f"   CD327 데이터 찾음:")
        for k, v in cd327_data.items():
            print(f"   - {k}: {v}")
    else:
        print("   CD327 데이터를 TB_CON_MST에서 찾을 수 없음!")
    
    # 3. CD327이 TB_API_KEY_MNGR에 있는지 확인
    print("\n3. CD327 TB_API_KEY_MNGR 조회:")
    cur.execute("SELECT * FROM TB_API_KEY_MNGR WHERE CD = %s", ('CD327',))
    cd327_api = cur.fetchone()
    if cd327_api:
        print(f"   CD327 API_KEY_MNGR 데이터 찾음:")
        for k, v in cd327_api.items():
            print(f"   - {k}: {v}")
    else:
        print("   CD327 데이터를 TB_API_KEY_MNGR에서 찾을 수 없음! -> 추가 대상")
    
    # 4. TB_CON_MST에서 CD327의 UDATE_DT 확인
    print("\n4. CD327 UDATE_DT 확인:")
    if cd327_data:
        print(f"   - UDATE_DT: {cd327_data.get('update_dt')}")
        print(f"   - ITEM10: {cd327_data.get('item10')}")
        print(f"   - CD_NM: {cd327_data.get('cd_nm')}")
    
    cur.close()
    conn.close()
    print("\n" + "=" * 60)
    print("테스트 완료")
    print("=" * 60)

if __name__ == '__main__':
    test_cd327_sync()
