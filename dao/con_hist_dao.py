                          
                                               

import logging
from dao.sql_loader import load_sql
from typing import Optional, List, Dict, Tuple
from msys.column_mapper import convert_to_legacy_columns

class ConHistDAO:
    def __init__(self, conn):
        self.conn = conn

    def get_summary(self, start_date: Optional[str] = None, end_date: Optional[str] = None, all_data: bool = False) -> List[Dict]:
        """
        대시보드 요약 데이터를 조회합니다.
        [KST 적용] DashboardSQL.get_dashboard_summary 쿼리를 사용합니다.
        """
                                            
        base_query = load_sql('dashboard/get_dashboard_summary.sql')
        conditions = []
        params = []
        if not all_data:
            kst_date_expr = "(start_dt AT TIME ZONE 'Asia/Seoul')::date"
            if start_date and end_date:
                conditions.append(f"{kst_date_expr} BETWEEN %s AND %s")
                params.extend([start_date, end_date])
            elif start_date:
                conditions.append(f"{kst_date_expr} >= %s")
                params.append(start_date)
            elif end_date:
                conditions.append(f"{kst_date_expr} <= %s")
                params.append(end_date)
        
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        query = base_query.format(where_clause=where_clause)
        with self.conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            logging.info(f"DAO: Fetched {len(results)} records for summary.")
            return convert_to_legacy_columns('TB_CON_HIST', results)

    def get_success_rate_trend_by_job(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        [기존 기능 유지] 기간별 Job ID별 수집 성공률 추이 데이터를 조회합니다.
        (이 함수는 현재 html/JS에서 직접적으로 사용되지 않음)
        """
                                
                                                                                                                   
                      
        return []

    def get_min_max_dates(self) -> Optional[Dict]:
        """
        tb_con_hist에서 가장 오래된 날짜와 가장 최신 날짜를 조회합니다.
        """
        query = load_sql('dashboard/get_min_max_dates.sql')
        with self.conn.cursor() as cur:
            cur.execute(query)
            result = cur.fetchone()
            if result:
                min_date_str = str(result[0]) if result[0] else None
                max_date_str = str(result[1]) if result[1] else None
                logging.info(f"DAO: Fetched min_date: {min_date_str}, max_date: {max_date_str}")
                return {"min_date": min_date_str, "max_date": max_date_str}
            logging.info("DAO: No min/max dates found in tb_con_hist.")
            return None

    def get_day_stats(self, date_str: str) -> List[Dict]:
        logging.warning(f"ConHistDAO.get_day_stats called for date: {date_str}. This method's implementation is not provided and may be deprecated.")
        return []

    def get_con_hist_detail(self, start_date: Optional[str] = None, end_date: Optional[str] = None, all_data: bool = False) -> List[Dict]:
        """
        tb_con_hist의 상세 데이터를 반환합니다. (start_dt, end_dt, con_id, job_id, rqs_info, status)
        [KST 적용] DashboardSQL.get_con_hist_detail 쿼리를 사용합니다.
        """
        base_query = load_sql('dashboard/get_con_hist_detail.sql')
        conditions = []
        params = []
        if not all_data:
            kst_date_expr = "(start_dt AT TIME ZONE 'Asia/Seoul')::date"
            if start_date and end_date:
                conditions.append(f"{kst_date_expr} BETWEEN %s AND %s")
                params.extend([start_date, end_date])
            elif start_date:
                conditions.append(f"{kst_date_expr} >= %s")
                params.append(start_date)
            elif end_date:
                conditions.append(f"{kst_date_expr} <= %s")
                params.append(end_date)

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        query = base_query.format(where_clause=where_clause)
        with self.conn.cursor() as cur:
            cur.execute(query, tuple(params))
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            return convert_to_legacy_columns('TB_CON_HIST', results)

    def get_raw_data(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None, all_data: bool = False) -> List[Dict]:
        """
        tb_con_hist에서 원천데이터(수집 및 가공 데이터)용 row를 반환합니다.
        RawDataSQL.get_raw_data 쿼리를 사용합니다.
        """
        base_query = load_sql('raw_data/get_raw_data.sql')
        conditions = []
        params = []

        if not all_data:
            kst_date_expr = "(start_dt AT TIME ZONE 'Asia/Seoul')::date"
            if start_date and end_date:
                conditions.append(f"{kst_date_expr} BETWEEN %s AND %s")
                params.extend([start_date, end_date])
            elif start_date:
                conditions.append(f"{kst_date_expr} >= %s")
                params.append(start_date)
            elif end_date:
                conditions.append(f"{kst_date_expr} <= %s")
                params.append(end_date)

        if job_ids:
            conditions.append("job_id = ANY(%s)")
            params.append(job_ids)

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
            
        query = base_query.format(where_clause=where_clause)
        with self.conn.cursor() as cur:
            cur.execute(query, tuple(params))
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            return convert_to_legacy_columns('TB_CON_HIST', results)

    def get_analytics_success_rate_trend(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        [분석 차트용] 기간별 Job ID별 수집 성공률 추이 데이터를 조회합니다.
        """
        logging.info(f"DAO: Executing get_analytics_success_rate_trend with start_date={start_date}, end_date={end_date}, job_ids={job_ids}")
        base_query = load_sql('analytics/get_success_rate_trend.sql')
        conditions = ["status IN ('CD901', 'CD902', 'CD903')"]
        params = []
        kst_date_expr = "(start_dt AT TIME ZONE 'Asia/Seoul')::date"
        if start_date and end_date:
            conditions.append(f"{kst_date_expr} BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        elif start_date:
            conditions.append(f"{kst_date_expr} >= %s")
            params.append(start_date)
        elif end_date:
            conditions.append(f"{kst_date_expr} <= %s")
            params.append(end_date)
        if job_ids:
            conditions.append("job_id = ANY(%s)")
            params.append(job_ids)
        where_clause = "WHERE " + " AND ".join(conditions)
        query = base_query.format(where_clause=where_clause)
        with self.conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            logging.info(f"DAO: Fetched {len(results)} records for analytics success rate trend.")
            return convert_to_legacy_columns('TB_CON_HIST', results)

    def get_analytics_trouble_by_code(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        [분석 차트용] 장애 코드별 비율 데이터를 조회합니다.
        """
        logging.info(f"DAO: Executing get_analytics_trouble_by_code with start_date={start_date}, end_date={end_date}, job_ids={job_ids}")
        base_query = load_sql('analytics/get_trouble_by_code.sql')
        conditions = ["status != 'CD901'"]
        params = []
        kst_date_expr = "(start_dt AT TIME ZONE 'Asia/Seoul')::date"
        if start_date and end_date:
            conditions.append(f"{kst_date_expr} BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        elif start_date:
            conditions.append(f"{kst_date_expr} >= %s")
            params.append(start_date)
        elif end_date:
            conditions.append(f"{kst_date_expr} <= %s")
            params.append(end_date)
        if job_ids:
            conditions.append("job_id = ANY(%s)")
            params.append(job_ids)
        where_clause = "WHERE " + " AND ".join(conditions)
        query = base_query.format(where_clause=where_clause)
        with self.conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            logging.info(f"DAO: Fetched {len(results)} records for analytics trouble by code.")
            return convert_to_legacy_columns('TB_CON_HIST', results)

    def get_distinct_job_ids(self):
        """
        tb_con_hist에서 실제 존재하는 job_id만 중복 없이 반환 (공통 쿼리 사용)
        """
        query = load_sql('common/get_distinct_job_ids.sql')
        with self.conn.cursor() as cur:
            cur.execute(query)
            return [row[0] for row in cur.fetchall() if row[0]]

    def get_daily_job_counts(self, job_id: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, all_data: bool = False) -> List[Dict]:
        """
        Jandi heatmap을 위한 일별 실행 횟수(quantity)를 조회합니다.
        """
        query = """
            SELECT
                job_id,
                TO_CHAR((start_dt AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') as log_dt,
                COUNT(*) as execution_count
            FROM
                tb_con_hist
            WHERE 1=1
        """
        params = []
        if job_id and job_id != 'all':
            query += " AND job_id = %s"
            params.append(job_id)

        if not all_data:
            kst_date_expr = "(start_dt AT TIME ZONE 'Asia/Seoul')::date"
            if start_date:
                query += f" AND {kst_date_expr} >= %s"
                params.append(start_date)
            if end_date:
                query += f" AND {kst_date_expr} <= %s"
                params.append(end_date)
        
        query += """
            GROUP BY
                job_id,
                (start_dt AT TIME ZONE 'Asia/Seoul')::date
            ORDER BY
                log_dt;
        """
        with self.conn.cursor() as cur:
            cur.execute(query, tuple(params))
            columns = [desc[0].lower() for desc in cur.description]
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            logging.info(f"DAO: Fetched {len(results)} records for daily job counts (Jandi).")
            return convert_to_legacy_columns('TB_CON_HIST', results)

    def get_available_years(self) -> List[int]:
        """
        tb_con_hist 테이블에 데이터가 존재하는 연도 목록을 조회합니다.
        """
        query = "SELECT DISTINCT EXTRACT(YEAR FROM (start_dt AT TIME ZONE 'Asia/Seoul'))::integer AS year FROM tb_con_hist ORDER BY year DESC;"
        with self.conn.cursor() as cur:
            cur.execute(query)
            results = [row[0] for row in cur.fetchall()]
            logging.info(f"DAO: Fetched {len(results)} available years.")
            return results
