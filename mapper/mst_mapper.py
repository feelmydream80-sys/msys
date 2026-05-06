                      
import logging
from typing import Optional
from sql.mst.mst_sql import MstSQL
from msys.column_mapper import convert_to_new_columns

class MstMapper:
    def __init__(self, conn):
        self.conn = conn

    def get_all_mst(self) -> list[dict]:
        try:
            with self.conn.cursor() as cur:
                query = MstSQL.get_all_mst()
                cur.execute(query)
                columns = [desc[0].lower() for desc in cur.description]
                data = [dict(zip(columns, row)) for row in cur.fetchall()]
                return convert_to_new_columns('TB_CON_MST', data)
        except Exception as e:
            logging.error(f"모든 MST 데이터 로드 실패: {e}", exc_info=True)
            return []

    def get_all_mst_for_schedule(self, job_ids: Optional[list[str]] = None) -> list[dict]:
        """데이터 수집 일정 로직을 위해 모든 컬럼을 조회합니다."""
        try:
            with self.conn.cursor() as cur:
                query = "SELECT * FROM tb_con_mst"
                params = []
                if job_ids:
                    query += " WHERE cd = ANY(%s)"
                    params.append(job_ids)
                
                cur.execute(query, params)
                columns = [desc[0].lower() for desc in cur.description]
                data = [dict(zip(columns, row)) for row in cur.fetchall()]
                return convert_to_new_columns('TB_CON_MST', data)
        except Exception as e:
            logging.error(f"스케줄용 MST 데이터 로드 실패: {e}", exc_info=True)
            return []

    def get_mst_data_by_cd(self, cd: str) -> Optional[dict]:
        try:
            with self.conn.cursor() as cur:
                query = MstSQL.get_mst_by_cd()
                cur.execute(query, (cd,))
                result = cur.fetchone()
                if result:
                    columns = [desc[0] for desc in cur.description]
                    data = dict(zip(columns, result))
                    return convert_to_new_columns('TB_CON_MST', data)
                return None
        except Exception as e:
            logging.error(f"tb_con_mst 데이터 로드 실패 (cd: {cd}): {e}", exc_info=True)
            return None

    def get_error_code_map(self) -> list[dict]:
        try:
            with self.conn.cursor() as cur:
                cur.execute(MstSQL.get_error_code_map())
                columns = [desc[0].lower() for desc in cur.description]
                data = [dict(zip(columns, row)) for row in cur.fetchall()]
                return convert_to_new_columns('TB_CON_MST', data)
        except Exception as e:
            logging.error(f"장애코드 매핑 데이터 로드 실패: {e}", exc_info=True)
            return []

    def get_job_mst_info(self, job_ids):
        if not job_ids:
            return {}
        format_strings = ','.join(['%s'] * len(job_ids))
        query = f"""
            SELECT cd, cd_nm, cd_desc, item1, item2, item3, item4, item5, item6, item7, item8, item9, item10, use_yn
            FROM tb_con_mst
            WHERE cd IN ({format_strings})
        """
        with self.conn.cursor() as cur:
            cur.execute(query, tuple(job_ids))
            columns = [desc[0].lower() for desc in cur.description]
            result = {}
            for row in cur.fetchall():
                row_dict = dict(zip(columns, row))
                job_id = row_dict['cd']
                result[job_id] = convert_to_new_columns('TB_CON_MST', row_dict)
            return result

    def get_paged_jobs(self, start, length, search_value, start_date=None, end_date=None, all_data=True, job_ids=None):
        with self.conn.cursor() as cur:
            params = []
            all_jobs_subquery = "SELECT DISTINCT job_id FROM tb_con_hist"
            
                                                                       
            total_query = "SELECT COUNT(DISTINCT job_id) FROM tb_con_hist"
            if job_ids:
                total_query += " WHERE job_id = ANY(%s)"
                cur.execute(total_query, (job_ids,))
            else:
                cur.execute(total_query)
            total_records = cur.fetchone()[0]

            where_conditions = []
            if search_value:
                where_conditions.append("(all_ids.job_id ILIKE %s OR mst.cd_nm ILIKE %s)")
                params.extend([f"%{search_value}%", f"%{search_value}%"])

            if job_ids:
                where_conditions.append("all_ids.job_id = ANY(%s)")
                params.append(job_ids)
            
            where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""

            query_body = f"""
                FROM ({all_jobs_subquery}) as all_ids
                LEFT JOIN tb_con_mst as mst ON all_ids.job_id = mst.cd
                {where_clause}
            """
            count_query = f"SELECT COUNT(DISTINCT all_ids.job_id) {query_body}"
            cur.execute(count_query, tuple(params))
            filtered_records = cur.fetchone()[0]

            data_query = f"""
                SELECT
                    all_ids.job_id,
                    mst.cd_nm,
                    mst.item6 as cron,
                    mst.cd_desc as description
                {query_body}
                ORDER BY all_ids.job_id
            """
            if length != -1:
                data_query += " LIMIT %s OFFSET %s"
                params.extend([length, start])

            cur.execute(data_query, tuple(params))
            
            columns = [desc[0].lower() for desc in cur.description]
            jobs = [dict(zip(columns, row)) for row in cur.fetchall()]
            
            converted_jobs = convert_to_new_columns('TB_CON_MST', jobs)
            return converted_jobs, total_records, filtered_records

    def get_all_job_ids(self) -> list[dict]:
        """
        tb_con_mst에서 모든 job_id (cd)와 job_nm (cd_nm)을 가져옵니다.
        cd를 기준으로 오름차순 정렬합니다.
        """
        try:
            with self.conn.cursor() as cur:
                query = "SELECT cd, cd_nm FROM tb_con_mst ORDER BY cd ASC"
                cur.execute(query)
                columns = [desc[0].lower() for desc in cur.description]
                results = [dict(zip(columns, row)) for row in cur.fetchall()]
                return results
        except Exception as e:
            logging.error(f"모든 Job ID와 이름 로드 실패: {e}", exc_info=True)
            return []
