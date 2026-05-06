from mapper.mapping_mapper import MappingMapper

class MappingService:
    def __init__(self, db_connection):
        self.conn = db_connection
        self.mapper = MappingMapper(db_connection)

    def get_all_mappings(self):
        """모든 매핑 정보를 가져옵니다."""
        return self.mapper.get_all_mappings()

    def add_mapping(self, mapping_data):
        """새로운 매핑을 추가합니다."""
                    
        if not mapping_data.get('new_tbl_nm') or not mapping_data.get('new_col_nm'):
            raise ValueError("새 테이블명과 새 컬럼명은 필수입니다.")
        
        self.mapper.add_mapping(mapping_data)

    def update_mapping(self, mapping_data):
        """매핑 정보를 업데이트합니다."""
        if not mapping_data.get('mapp_id'):
            raise ValueError("매핑 ID가 필요합니다.")
            
        self.mapper.update_mapping(mapping_data)

    def delete_mapping(self, mapp_id):
        """매핑 정보를 삭제합니다."""
        self.mapper.delete_mapping(mapp_id)

    def get_unmapped_columns(self):
        """
        현재 DB 스키마와 매핑 테이블을 비교하여
        아직 매핑되지 않은 컬럼 목록을 반환합니다.
        """
        all_schema_columns = self.mapper.get_all_schema_columns()
        all_mappings = self.mapper.get_all_mappings()

                                       
        mapped_columns = set()
        for mapping in all_mappings:
            mapped_columns.add((mapping['new_tbl_nm'], mapping['new_col_nm']))

        unmapped_columns = []
        for schema_col in all_schema_columns:
                                              
            if schema_col['table_name'] == 'tb_col_mapp':
                continue
            
            if (schema_col['table_name'], schema_col['column_name']) not in mapped_columns:
                unmapped_columns.append({
                    'table_name': schema_col['table_name'],
                    'column_name': schema_col['column_name']
                })
        
        return unmapped_columns
