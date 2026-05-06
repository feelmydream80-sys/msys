                           
                                              
                                           

import logging
                                                        
from sql.trbl.trbl_sql import TrblSQL as SQL              
                                                         
from datetime import datetime, date
from typing import Optional, List, Dict, Tuple
from msys.column_mapper import convert_to_legacy_columns

                                                                 

class TrblHistDAO:
    def __init__(self, conn):
        self.conn = conn

    def get_all_troubles(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
        """
        tb_con_hist에서 장애 상태 (CD902, CD903)별 전체 카운트를 조회합니다.
        날짜 필터링을 지원합니다.
        @AI_NOTE: 이 함수는 trbl_service.py의 fetch_trouble_list에서 호출됩니다.
        @AI_EXPECTED_INPUT:
            - conn: DB 연결 객체
            - start_date (string,ylobacter-MM-DD, optional)
            - end_date (string,ylobacter-MM-DD, optional)
        @AI_EXPECTED_OUTPUT:
            - List of Dict: [{ "trbl_status": string, "count": int }, ...]
        """
        logging.info(f"▶ DAO: get_all_troubles 호출됨 (시작일: {start_date}, 종료일: {end_date})")
        cur = self.conn.cursor()
        try:
                                                             
            query, params = SQL.get_all_troubles_query(start_date, end_date)
           
            logging.debug(f"DAO: SQL 쿼리 실행 직전 - 쿼리: {query.strip()[:200]}..., 파라미터: {params}")
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
           
            logging.info(f"✅ DAO: DB로부터 원시 로우 {len(rows)}건 수신. 컬럼: {columns}")
            if rows:
                logging.debug(f"DAO: 첫 번째 로우 데이터: {rows[0]}")
            else:
                logging.warning("⚠️ DAO: DB로부터 받은 로우 데이터가 0건입니다. SQL 쿼리 및 DB 데이터 확인 필요.")
           
            processed_results = []
            for row_tuple in rows:
                                             
                normalized_row_dict = {k.lower(): v for k, v in zip(columns, row_tuple)}
                                                                                         
                status = normalized_row_dict.get('trbl_status')
                count = normalized_row_dict.get('count')
               
                logging.debug(f"DAO: get_all_troubles - Extracted: trbl_status='{status}', count='{count}'")

                processed_results.append({
                    'trbl_status': status,
                    'count': count
                })
            logging.info(f"✅ DAO: DB 로우 데이터 가공 완료. 최종 {len(processed_results)}건 반환.")
            return convert_to_legacy_columns('TB_CON_HIST', processed_results)
        except Exception as e:
            logging.error(f"❌ DAO: DB 조회 중 오류 발생: {e}", exc_info=True)
            self.conn.rollback()             
            raise                                       
        finally:
            cur.close()
       
    def get_hourly_trouble_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
        """
        tb_con_hist에서 장애 상태 (CD902, CD903)의 시간대별 전체 카운트를 조회합니다.
        날짜 필터링을 지원합니다.
        @AI_NOTE: 이 함수는 trbl_service.py의 fetch_hourly_trouble_stats에서 호출됩니다.
        @AI_EXPECTED_INPUT:
            - conn: DB 연결 객체
            - start_date (string,ylobacter-MM-DD, optional)
            - end_date (string,ylobacter-MM-DD, optional)
        @AI_EXPECTED_OUTPUT:
            - List of Dict: [{ "hour": int, "count": int }, ...]
        """
        logging.info(f"▶ DAO: get_hourly_trouble_stats 호출됨 (시작일: {start_date}, 종료일: {end_date})")
        cur = self.conn.cursor()
        try:
                                                               
            query, params = SQL.get_trouble_hourly_query(start_date, end_date)
           
            logging.debug(f"DAO: SQL 쿼리 실행 직전 - 쿼리: {query.strip()[:200]}..., 파라미터: {params}")
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
           
            logging.info(f"✅ DAO: DB로부터 원시 로우 {len(rows)}건 수신. 컬럼: {columns}")
            if rows:
                logging.debug(f"DAO: 첫 번째 로우 데이터: {rows[0]}")
            else:
                logging.warning("⚠️ DAO: DB로부터 받은 로우 데이터가 0건입니다. SQL 쿼리 및 DB 데이터 확인 필요.")

            processed_results = []
            for row_tuple in rows:
                normalized_row_dict = {k.lower(): v for k, v in zip(columns, row_tuple)}
                hour = normalized_row_dict.get('hour')
                count = normalized_row_dict.get('count')
               
                logging.debug(f"DAO: get_hourly_trouble_stats - Extracted: hour='{hour}', count='{count}'")

                processed_results.append(
                    {"hour": int(hour) if hour is not None else None, "count": int(count) if count is not None else None}
                )
            logging.info(f"✅ DAO: DB 로우 데이터 가공 완료. 최종 {len(processed_results)}건 반환.")
            return convert_to_legacy_columns('TB_CON_HIST', processed_results)
        except Exception as e:
            logging.error(f"❌ DAO: DB 조회 중 오류 발생: {e}", exc_info=True)
            self.conn.rollback()
            raise
        finally:
            cur.close()
 
    def get_trouble_hourly_by_status(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        tb_con_hist에서 장애 상태 (CD902, CD903)의 시간대별, 상태별 카운트를 조회합니다.
        날짜 필터링 및 Job ID 필터링을 지원합니다.
        @AI_NOTE: 이 함수는 trbl_service.py의 fetch_trouble_hourly_by_status에서 호출됩니다.
        @AI_EXPECTED_INPUT:
            - start_date (string,ylobacter-MM-DD)
            - end_date (string,ylobacter-MM-DD)
            - job_ids (list of string, optional): Job ID 목록 (SQL 쿼리에서 사용)
        @AI_EXPECTED_OUTPUT:
            - List of Dict: [{ "hour": int, "status": string, "count": int }, ...]
            - SQL 쿼리에서 'status AS trbl_status'로 반환되므로, DAO에서 'status'로 매핑합니다.
        """
        logging.info(f"▶ DAO: get_trouble_hourly_by_status 호출됨 (시작일: {start_date}, 종료일: {end_date}, Job IDs: {job_ids})")
        cur = self.conn.cursor()
       
        try:
                          
                                                                         
                                                                                                          
            query, params = SQL.get_trouble_hourly_by_status_query(start_date, end_date, job_ids)
           
            logging.debug(f"DAO: SQL 쿼리 실행 직전 - 쿼리: {query.strip()[:200]}..., 파라미터: {params}")
           
                      
            cur.execute(query, params)
           
                        
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
           
            logging.info(f"✅ DAO: DB로부터 장애 원시 로우 {len(rows)}건 수신. 컬럼: {columns}")
            if rows:
                logging.debug(f"DAO: 첫 번째 로우 데이터: {rows[0]}")
            else:
                logging.warning("⚠️ DAO: DB로부터 받은 장애 로우 데이터가 0건입니다. SQL 쿼리 및 DB 데이터 확인 필요.")

            processed_results = []
            for row_tuple in rows:
                normalized_row_dict = {k.lower(): v for k, v in zip(columns, row_tuple)}
                hour = normalized_row_dict.get('hour')
                                                                                         
                                                                    
                status = normalized_row_dict.get('trbl_status')
                count = normalized_row_dict.get('count')
               
                logging.debug(f"DAO: get_trouble_hourly_by_status - Extracted: hour='{hour}', status='{status}', count='{count}'")

                processed_results.append(
                    {"hour": int(hour) if hour is not None else None, "status": status, "count": int(count) if count is not None else None}
                )
            logging.info(f"✅ DAO: DB 로우 데이터 가공 완료. 최종 {len(processed_results)}건 반환.")
            return convert_to_legacy_columns('TB_CON_HIST', processed_results)
        except Exception as e:
            logging.error(f"❌ DAO: DB 조회 중 오류 발생: {e}", exc_info=True)
            self.conn.rollback()             
            raise                                       
        finally:
            cur.close()

    def get_success_rate_trend_by_job(self, start_date_str: Optional[str] = None, end_date_str: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        데이터베이스에서 기간별 Job ID별 수집 성공률 추이 데이터를 조회합니다.
        @AI_NOTE: 이 함수는 trbl_service.py의 fetch_success_rate_trend_by_job에서 호출됩니다.
        @AI_EXPECTED_INPUT:
            - start_date_str (string,ylobacter-MM-DD)
            - end_date_str (string,ylobacter-MM-DD)
            - job_ids (list of string): Job ID 목록 (SQL 쿼리에서 사용)
        @AI_EXPECTED_OUTPUT:
            - List of Dict: [{ "log_dt": string (HTTP Date), "job_id": string, "success_count": int, "fail_count": int, "no_data_count": int }, ...]
        """
        logging.info(f"▶ DAO: get_success_rate_trend_by_job 호출됨 (시작일: {start_date_str}, 종료일: {end_date_str}, Job IDs: {job_ids})")
        cur = self.conn.cursor()

        try:
                          
                                                                
                                                                                                         
            query, params = SQL.success_rate_trend_by_job(start_date_str, end_date_str, job_ids)

            logging.debug(f"DAO: SQL 쿼리 실행 직전 - 쿼리: {query.strip()[:200]}..., 파라미터: {params}")

                      
            cur.execute(query, params)

                        
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

            logging.info(f"✅ DAO: DB로부터 성공률 추이 원시 로우 {len(rows)}건 수신. 컬럼: {columns}")
            if rows:
                logging.debug(f"DAO: 첫 번째 로우 데이터: {rows[0]}")
            else:
                logging.warning("⚠️ DAO: DB로부터 받은 성공률 추이 로우 데이터가 0건입니다. SQL 쿼리 및 DB 데이터 확인 필요.")

                                    
            result = []
            for row_tuple in rows:
                row_dict = dict(zip(columns, row_tuple))
                                                                               
                                                                             
                if 'log_dt' in row_dict and isinstance(row_dict['log_dt'], (datetime, date)):
                    row_dict['log_dt'] = row_dict['log_dt'].strftime("%a, %d %b %Y %H:%M:%S GMT")
                result.append(row_dict)

            logging.info(f"✅ DAO: DB 로우 데이터 가공 완료. 최종 {len(result)}건 반환.")
            return convert_to_legacy_columns('TB_CON_HIST', result)
        except Exception as e:
            logging.error(f"❌ DAO: 성공률 추이 DB 조회 중 오류 발생: {e}", exc_info=True)
            self.conn.rollback()
            raise
        finally:
            cur.close()
