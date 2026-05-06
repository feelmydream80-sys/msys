import logging
from typing import Optional, Dict
from mapper.mst_mapper import MstMapper

class ConMstService:
    def __init__(self, db_connection):
        self.conn = db_connection
        self.mst_mapper = MstMapper(db_connection)

    def fetch_mst_list(self):
        return self.mst_mapper.get_all_mst()

    def get_cd_nm_item2(self, cd: str) -> tuple[Optional[str], Optional[str]]:
        """
        tb_con_mst에서 cd_nm과 item2를 조회하여 반환합니다.
        """
        try:
            data = self.mst_mapper.get_mst_data_by_cd(cd)
            if data:
                return data.get('cd_nm'), data.get('item2')
            return None, None
        except Exception as e:
            logging.error(f"❌ ConMstService: cd_nm, item2 조회 실패 (cd: {cd}): {e}", exc_info=True)
            return None, None

    def get_job_mst_info(self, job_ids):
        """
        job_id 리스트에 해당하는 마스터 상세정보를 dict로 반환
        {job_id: {cd_nm, cd_desc, item1, ...}}
        """
        return self.mst_mapper.get_job_mst_info(job_ids)

    def get_paged_jobs(self, start, length, search_value, start_date=None, end_date=None, all_data=True, user: Optional[Dict] = None):
        allowed_job_ids = None
        if user:
            is_admin = 'mngr_sett' in user.get('permissions', [])
            user_id = user.get('user_id', 'Unknown')
            logging.info(f"Checking data permissions for user: {user_id}, is_admin: {is_admin}")
            if not is_admin:
                allowed_job_ids = user.get('data_permissions', [])
                logging.info(f"Non-admin user. Applying data permissions. Allowed jobs: {allowed_job_ids}")
                if not allowed_job_ids:
                    logging.warning(f"User {user_id} has no data permissions. Returning empty job list.")
                    return [], 0, 0                                                         
            else:
                logging.info(f"Admin user {user_id}. No data permission filtering applied.")
        
        return self.mst_mapper.get_paged_jobs(start, length, search_value, start_date, end_date, all_data, job_ids=allowed_job_ids)
            
    def get_error_code_map(self):
        return self.mst_mapper.get_error_code_map()
