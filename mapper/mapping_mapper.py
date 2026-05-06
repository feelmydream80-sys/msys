                          
"""
컬럼 매핑 정보 관련 데이터 변환을 책임지는 매퍼 계층입니다.
"""
from sql.mapping.mapping_sql import MappingSQL

class MappingMapper:
    def __init__(self, db_connection):
        self.conn = db_connection

    def get_all_mappings(self):
        from msys.column_mapper import convert_to_new_columns
        with self.conn.cursor() as cur:
            cur.execute(MappingSQL.get_all_mappings())
            columns = [desc[0].lower() for desc in cur.description]
            rows = cur.fetchall()
            mappings = [dict(zip(columns, row)) for row in rows]
            return convert_to_new_columns('tb_col_mapp', mappings)

    def add_mapping(self, mapping_data):
        from msys.column_mapper import convert_to_new_columns
        with self.conn.cursor() as cur:
            converted_data = convert_to_new_columns('tb_col_mapp', mapping_data)
            cur.execute(MappingSQL.add_mapping(), converted_data)

    def update_mapping(self, mapping_data):
        from msys.column_mapper import convert_to_new_columns
        with self.conn.cursor() as cur:
            converted_data = convert_to_new_columns('tb_col_mapp', mapping_data)
            cur.execute(MappingSQL.update_mapping(), converted_data)

    def delete_mapping(self, mapp_id):
        with self.conn.cursor() as cur:
            cur.execute(MappingSQL.delete_mapping(), (mapp_id,))

    def get_all_schema_columns(self):
        with self.conn.cursor() as cur:
            cur.execute(MappingSQL.get_all_schema_columns())
            columns = [desc[0].lower() for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(columns, row)) for row in rows]
