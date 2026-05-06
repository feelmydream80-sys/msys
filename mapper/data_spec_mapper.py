                            
"""
데이터 명세서 관련 데이터 변환을 책임지는 매퍼 계층입니다.
"""
import logging
from dao.data_spec_dao import DataSpecDAO
from msys.column_mapper import convert_to_legacy_columns, convert_to_new_columns

class DataSpecMapper:
    def __init__(self, db_connection):
        self.conn = db_connection
        self.dao = DataSpecDAO(self.conn)

    def get_all_specs(self):
        specs = self.dao.get_all_specs()
        return convert_to_legacy_columns('TB_DATA_SPEC', specs)

    def get_spec_by_id(self, spec_id):
        spec = self.dao.get_spec_by_id(spec_id)
        if not spec:
            return None
        
                                   
        converted_spec = convert_to_legacy_columns('TB_DATA_SPEC', spec)
        if 'params' in spec:
            converted_spec['params'] = convert_to_legacy_columns('TB_DATA_SPEC_PARM', spec['params'])
        
        return converted_spec

    def create_spec(self, spec_data, params_data):
        converted_spec_data = convert_to_new_columns('TB_DATA_SPEC', spec_data)
        converted_params_data = [convert_to_new_columns('TB_DATA_SPEC_PARM', p) for p in params_data]
        
        spec_id = self.dao.create_spec(converted_spec_data, converted_params_data)
        return spec_id

    def update_spec(self, spec_id, spec_data, params_data):
        converted_spec_data = convert_to_new_columns('TB_DATA_SPEC', spec_data)
        converted_params_data = [convert_to_new_columns('TB_DATA_SPEC_PARM', p) for p in params_data]
        success = self.dao.update_spec(spec_id, converted_spec_data, converted_params_data)
        return success

    def delete_spec(self, spec_id):
        success = self.dao.delete_spec(spec_id)
        return success

    def get_password_hash(self, spec_id):
        return self.dao.get_password_hash(spec_id)

    def find_by_data_name(self, data_name):
        spec = self.dao.find_by_data_name(data_name)
        return convert_to_legacy_columns('TB_DATA_SPEC', spec) if spec else None
