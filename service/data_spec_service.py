                              
import logging
import os
from mapper.data_spec_mapper import DataSpecMapper
from .password_service import PasswordService
from .spec_scraper_service import SpecScraperService
from .url_analyzer_service import UrlAnalyzerService

class DataSpecService:
    def __init__(self, db_connection):
        self.conn = db_connection
        self.data_spec_mapper = DataSpecMapper(db_connection)
        self.scraper_service = SpecScraperService()
        self.password_service = PasswordService()
        self.url_analyzer_service = UrlAnalyzerService()

    def get_all_specs(self):
        return self.data_spec_mapper.get_all_specs()

    def get_spec_by_id(self, spec_id):
        return self.data_spec_mapper.get_spec_by_id(spec_id)

    def create_spec(self, spec_data, params_data):
        try:
            mapper = self.data_spec_mapper
            data_name = spec_data.get('data_name')
            if not data_name:
                raise ValueError("데이터 명칭은 필수 항목입니다.")
            if self.check_name_exists(data_name):
                raise ValueError(f"이미 동일한 데이터 명칭('{data_name}')의 명세서가 존재합니다.")

            password = spec_data.get('password')
            if not password or len(password) < 4:
                raise ValueError("비밀번호는 4자리 이상이어야 합니다.")
            
            spec_data['password'] = self.password_service.hash_password(password)

            spec_id = mapper.create_spec(spec_data, params_data)
            return spec_id
        except Exception:
            raise

    def check_name_exists(self, data_name, spec_id=None):
        mapper = self.data_spec_mapper
        existing_spec = mapper.find_by_data_name(data_name)
        if not existing_spec:
            return False
        if spec_id and existing_spec.get('id') == spec_id:
            return False                                         
        return True

    def update_spec(self, spec_id, spec_data, params_data):
        try:
            mapper = self.data_spec_mapper
            data_name = spec_data.get('data_name')
            if not data_name:
                raise ValueError("데이터 명칭은 필수 항목입니다.")
            if self.check_name_exists(data_name, spec_id):
                 raise ValueError(f"이미 동일한 데이터 명칭('{data_name}')의 명세서가 존재합니다.")

            password = spec_data.get('password')
            if password:
                if len(password) < 4:
                    raise ValueError("비밀번호는 4자리 이상이어야 합니다.")
                spec_data['password'] = self.password_service.hash_password(password)
            else:
                spec_data.pop('password', None)
            
            success = mapper.update_spec(spec_id, spec_data, params_data)
            return success
        except Exception:
            raise

    def delete_spec(self, spec_id, password):
        try:
            mapper = self.data_spec_mapper
            master_password = os.getenv('MASTER_PASSWORD')
            hashed_pw = mapper.get_password_hash(spec_id)

                         
            if password and password == master_password:
                is_authorized = True
                                            
            elif not hashed_pw:
                is_authorized = not password
                                         
            else:
                is_authorized = self.password_service.check_password(password, hashed_pw)

            if not is_authorized:
                raise ValueError("비밀번호가 일치하지 않습니다.")

            success = mapper.delete_spec(spec_id)
            return success
        except Exception:
            raise

    def scrape_spec_from_url(self, url):
        return self.scraper_service.scrape_from_url(url)
