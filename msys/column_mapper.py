import json

class ColumnMapper:
    _instance = None
    _mapping_data = {}
    _reverse_mapping_data = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ColumnMapper, cls).__new__(cls)
                                                              
            cls._instance.load_mapping_from_json()
            cls._instance.create_forward_mapping()
        return cls._instance

    def init_db_mappings(self, db_conn):
        """데이터베이스에서 매핑 정보를 로드하고 정방향 매핑을 다시 생성합니다."""
        self.load_mapping_from_db(db_conn)
        self.create_forward_mapping()

    def load_mapping_from_json(self):
        """JSON 설정 파일에서 기본 컬럼 매핑 정보를 로드합니다."""
        try:
            with open('msys/column_mapping.json', 'r', encoding='utf-8') as f:
                json_mappings = json.load(f)
            
            self._reverse_mapping_data = {}
            for table, mappings in json_mappings.items():
                self._reverse_mapping_data[table.strip().lower()] = {k.strip().lower(): v.strip().lower() for k, v in mappings.items()}
        except FileNotFoundError:
            print("msys/column_mapping.json not found. Starting with empty mappings.")
            self._reverse_mapping_data = {}
        except Exception as e:
            print(f"Error loading column mapping from JSON: {e}")
            self._reverse_mapping_data = {}

    def load_mapping_from_db(self, db_conn):
        """데이터베이스에서 컬럼 매핑 정보를 로드하여 기존 매핑을 확장/덮어씁니다."""
        try:
            from mapper.mapping_mapper import MappingMapper
            mapping_mapper = MappingMapper(db_conn)
            db_mappings = mapping_mapper.get_all_mappings()

            for m in db_mappings:
                new_table = m['new_tbl_nm'].strip().lower()
                if m['bf_tbl_nm'] and m['bf_col_nm']:
                    if new_table not in self._reverse_mapping_data:
                        self._reverse_mapping_data[new_table] = {}
                    
                    bf_col = m['bf_col_nm'].strip().lower()
                    new_col = m['new_col_nm'].strip().lower()
                    
                                                                  
                    if bf_col not in self._reverse_mapping_data[new_table]:
                        self._reverse_mapping_data[new_table][bf_col] = new_col
        except Exception as e:
            print(f"Error loading column mapping from DB: {e}")

    def create_forward_mapping(self):
        """역방향 매핑(_reverse_mapping_data)을 기반으로 정방향 매핑(_mapping_data)을 생성합니다."""
        self._mapping_data = {}
        for table, mappings in self._reverse_mapping_data.items():
            self._mapping_data[table] = {v: k for k, v in mappings.items()}

    def reload(self):
        """매핑 정보를 다시 로드합니다."""
        self.load_mapping_from_json()
                                              
        self.create_forward_mapping()

    def get_mapping(self, table_name):
        """새 컬럼명 -> 레거시 컬럼명 매핑을 반환합니다."""
        return self._mapping_data.get(table_name.lower(), {})

    def get_reverse_mapping(self, table_name):
        """레거시 컬럼명 -> 새 컬럼명 매핑을 반환합니다."""
        return self._reverse_mapping_data.get(table_name.lower(), {})

    def convert_to_legacy_columns(self, table_name, data):
        """
        데이터의 컬럼명을 새로운 표준에서 레거시 이름으로 변환합니다.
        주로 DB 조회 결과를 레거시 코드에 전달할 때 사용됩니다.
        """
        return [self._convert_row_to_legacy(table_name, row) for row in data] if isinstance(data, list) else self._convert_row_to_legacy(table_name, data)

    def _convert_row_to_legacy(self, table_name, row):
        """DB 조회 결과를 레거시 컬럼명으로 변환합니다."""
        mapping = self.get_mapping(table_name)
        return {mapping.get(new_col.strip().lower(), new_col.strip().lower()): value for new_col, value in row.items()} if (mapping and isinstance(row, dict)) else row

    def convert_to_new_columns(self, table_name, data):
        """
        레거시 데이터를 새로운 표준 컬럼명으로 변환합니다.
        매핑되지 않은 키-값 쌍은 그대로 유지됩니다.
        """
        reverse_mapping = self.get_reverse_mapping(table_name)
        if not reverse_mapping:
            return data

        if isinstance(data, list):
            return [self.convert_to_new_columns(table_name, d) for d in data]

        return {reverse_mapping.get(legacy_col.strip().lower(), legacy_col.strip().lower()): value for legacy_col, value in data.items()} if isinstance(data, dict) else data

                    
column_mapper = ColumnMapper()

def convert_to_legacy_columns(table_name, data):
    """편의 함수: DB 결과를 레거시 코드로 전달"""
    return column_mapper.convert_to_legacy_columns(table_name, data)

def convert_to_new_columns(table_name, data):
    """편의 함수: 레거시 데이터를 DB로 전달"""
    return column_mapper.convert_to_new_columns(table_name, data)

def reload_mappings():
    """편의 함수: 매핑 정보 갱신"""
    column_mapper.reload()
