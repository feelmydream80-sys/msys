                       
import logging
from typing import Optional, List, Dict
from datetime import datetime, date
from sql.trbl.trbl_sql import TrblSQL
from sql.dashboard.dashboard_sql import DashboardSQL
from msys.column_mapper import convert_to_new_columns

class TrblMapper:
    def __init__(self, conn):
        self.conn = conn

    def get_all_troubles(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
        logging.info(f"▶ Mapper: get_all_troubles 호출됨 (시작일: {start_date}, 종료일: {end_date})")
        cur = self.conn.cursor()
        try:
            query, params = TrblSQL.get_all_troubles_query(start_date, end_date)
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            
            processed_results = []
            for row_tuple in rows:
                normalized_row_dict = {k.lower(): v for k, v in zip(columns, row_tuple)}
                status = normalized_row_dict.get('trbl_status')
                count = normalized_row_dict.get('count')
                processed_results.append({'trbl_status': status, 'count': count})
            
            return convert_to_new_columns('TB_CON_HIST', processed_results)
        finally:
            cur.close()

    def get_hourly_trouble_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
        logging.info(f"▶ Mapper: get_hourly_trouble_stats 호출됨 (시작일: {start_date}, 종료일: {end_date})")
        cur = self.conn.cursor()
        try:
            query, params = TrblSQL.get_trouble_hourly_query(start_date, end_date)
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

            processed_results = []
            for row_tuple in rows:
                normalized_row_dict = {k.lower(): v for k, v in zip(columns, row_tuple)}
                hour = normalized_row_dict.get('hour')
                count = normalized_row_dict.get('count')
                processed_results.append({"hour": int(hour) if hour is not None else None, "count": int(count) if count is not None else None})

            return convert_to_new_columns('TB_CON_HIST', processed_results)
        finally:
            cur.close()

    def get_trouble_hourly_by_status(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        logging.info(f"▶ Mapper: get_trouble_hourly_by_status 호출됨 (시작일: {start_date}, 종료일: {end_date}, Job IDs: {job_ids})")
        cur = self.conn.cursor()
        try:
            query, params = TrblSQL.get_trouble_hourly_by_status_query(start_date, end_date, job_ids)
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

            processed_results = []
            for row_tuple in rows:
                normalized_row_dict = {k.lower(): v for k, v in zip(columns, row_tuple)}
                hour = normalized_row_dict.get('hour')
                status = normalized_row_dict.get('trbl_status')
                count = normalized_row_dict.get('count')
                processed_results.append({"hour": int(hour) if hour is not None else None, "status": status, "count": int(count) if count is not None else None})

            return convert_to_new_columns('TB_CON_HIST', processed_results)
        finally:
            cur.close()

    def get_success_rate_trend_by_job(self, start_date_str: Optional[str] = None, end_date_str: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        logging.info(f"▶ Mapper: get_success_rate_trend_by_job 호출됨 (시작일: {start_date_str}, 종료일: {end_date_str}, Job IDs: {job_ids})")
        cur = self.conn.cursor()
        try:
            query, params = TrblSQL.success_rate_trend_by_job(start_date_str, end_date_str, job_ids)
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

            result = []
            for row_tuple in rows:
                row_dict = dict(zip(columns, row_tuple))
                if 'log_dt' in row_dict and isinstance(row_dict['log_dt'], (datetime, date)):
                    row_dict['log_dt'] = row_dict['log_dt'].strftime("%a, %d %b %Y %H:%M:%S GMT")
                result.append(row_dict)

            return convert_to_new_columns('TB_CON_HIST', result)
        finally:
            cur.close()
