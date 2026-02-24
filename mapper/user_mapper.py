# mapper/user_mapper.py
"""
사용자 정보 관련 데이터 변환을 책임지는 매퍼 계층입니다.
"""
import logging
from typing import List, Dict, Any
from msys.database import get_db_connection
from sql.user.user_sql import UserSQL
from utils.sql_loader import load_sql

class UserMapper:
    def __init__(self, db_connection):
        self.conn = db_connection

    def find_by_id(self, user_id: str) -> Dict[str, Any]:
        with self.conn.cursor() as cur:
                cur.execute(UserSQL.find_by_id(), (user_id,))
                columns = [desc[0] for desc in cur.description]
                row = cur.fetchone()
                if not row:
                    return None
                user = dict(zip(columns, row))
                return user

    def find_all(self) -> List[Dict[str, Any]]:
        with self.conn.cursor() as cur:
                cur.execute(UserSQL.find_all())
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                users = [dict(zip(columns, row)) for row in rows]
                from msys.column_mapper import convert_to_new_columns
                return convert_to_new_columns('TB_USER', users)

    def delete_by_id(self, user_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(UserSQL.delete_by_id(), (user_id,))

    def save(self, user_id: str, hashed_password: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(UserSQL.save(), (user_id, hashed_password))

    def update_status(self, user_id: str, status: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(UserSQL.update_status(), (status, user_id))

    def update_password(self, user_id: str, hashed_password: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(UserSQL.update_password(), (hashed_password, user_id))

    def find_user_permissions(self, user_id: str) -> List[str]:
        with self.conn.cursor() as cur:
                cur.execute(UserSQL.find_user_permissions(), (user_id,))
                return [row[0] for row in cur.fetchall()]

    def find_all_permissions(self) -> List[Dict[str, Any]]:
        with self.conn.cursor() as cur:
                cur.execute(UserSQL.find_all_permissions())
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                permissions = [dict(zip(columns, row)) for row in rows]
                from msys.column_mapper import convert_to_new_columns
                return convert_to_new_columns('TB_USER_AUTH_CTRL', permissions)

    def find_all_menus(self) -> List[Dict[str, Any]]:
        with self.conn.cursor() as cur:
                cur.execute(UserSQL.find_all_menus())
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                menus = [dict(zip(columns, row)) for row in rows]
                from msys.column_mapper import convert_to_new_columns
                return convert_to_new_columns('TB_MENU', menus)

    def update_user_permissions(self, user_id: str, menu_ids: List[str]) -> None:
        with self.conn.cursor() as cur:
            # 먼저 해당 사용자의 모든 권한을 삭제합니다.
            cur.execute(UserSQL.delete_user_permissions(), (user_id,))
            
            # menu_ids 리스트에 값이 있는 경우, 새로운 권한을 추가합니다.
            if menu_ids:
                # 중복 권한을 제거하기 위해 set으로 변환한 후 다시 리스트로 변환
                unique_menu_ids = list(set(menu_ids))
                # executemany를 위한 데이터 리스트 생성 (user_id, menu_id) 튜플의 리스트
                permission_data = [(user_id, menu_id) for menu_id in unique_menu_ids]
                # executemany를 사용하여 여러 권한을 한 번에 INSERT
                cur.executemany(UserSQL.insert_user_permission(), permission_data)

    def find_user_menus_sorted(self, user_id: str) -> List[Dict[str, Any]]:
        with self.conn.cursor() as cur:
            cur.execute(UserSQL.find_user_menus_sorted(), (user_id,))
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            menus = [dict(zip(columns, row)) for row in rows]
            return menus

    def find_all_users_with_data_permissions(self, search_term: str = None) -> List[Dict[str, Any]]:
        sql = load_sql('sql/user/find_all_users_with_data_permissions.sql')
        search_sql = ""
        params = {}
        if search_term:
            search_sql = "WHERE A.USER_ID LIKE :search_term OR A.USER_NM LIKE :search_term"
            params['search_term'] = f"%{search_term}%"
        
        final_sql = sql.replace("-- {{search_sql}}", search_sql)

        with self.conn.cursor() as cur:
            cur.execute(final_sql, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(columns, row)) for row in rows]

    def find_data_permissions_by_user_id(self, user_id: str) -> List[str]:
        sql = load_sql('sql/user/find_data_permissions_by_user_id.sql')
        with self.conn.cursor() as cur:
            cur.execute(sql, {'user_id': user_id})
            
            # 데이터베이스 드라이버가 반환한 원본 데이터를 로깅합니다.
            raw_data = cur.fetchall()
            logging.info(f"DATA_PERMISSIONS_MAPPER_DEBUG: Raw data from fetchall(): {raw_data}")
            
            # 리스트 컴프리헨션으로 데이터를 가공합니다.
            processed_data = [row[0] for row in raw_data]
            logging.info(f"DATA_PERMISSIONS_MAPPER_DEBUG: Processed data after [row[0]]: {processed_data}")
            
            return processed_data

    def delete_data_permissions_by_user_id(self, user_id: str):
        sql = load_sql('sql/user/delete_data_permissions_by_user_id.sql')
        with self.conn.cursor() as cur:
            cur.execute(sql, {'user_id': user_id})

    def insert_data_permission(self, user_id: str, job_id: str):
        sql = load_sql('sql/user/insert_data_permission.sql')
        with self.conn.cursor() as cur:
            cur.execute(sql, {'user_id': user_id, 'job_id': job_id})
