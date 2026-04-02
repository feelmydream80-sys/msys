"""TB_API_KEY_MNGR 테이블에 대한 DAO (Data Access Object)"""

from msys.database import get_db_connection
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any
import logging

class ApiKeyMngrDao:
    """TB_API_KEY_MNGR 테이블의 CRUD operations"""

    def __init__(self):
        """Initialize ApiKeyMngrDao"""
        self.logger = logging.getLogger(__name__)

    def select_all(self) -> List[Dict[str, Any]]:
        """Select all records from TB_API_KEY_MNGR with joined TB_CON_MST data"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT 
                    a.cd,
                    b.ITEM10 as api_key,
                    a.api_ownr_email_addr,
                    a.due,
                    a.start_dt
                FROM TB_API_KEY_MNGR a
                LEFT JOIN TB_CON_MST b ON a.cd = b.CD
            """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                data.append({
                    'cd': row[0],
                    'api_key': row[1],
                    'api_ownr_email_addr': row[2],
                    'due': row[3],
                    'start_dt': row[4]
                })
            
            self.logger.debug(f"Fetched {len(data)} records from TB_API_KEY_MNGR with joined TB_CON_MST data")
            return data
            
        except Exception as e:
            self.logger.error(f"Error selecting all API key manager data: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()

    def select_by_cd(self, cd: str) -> Dict[str, Any]:
        """Select a record from TB_API_KEY_MNGR by CD"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT 
                    a.cd,
                    b.ITEM10 as api_key,
                    a.api_ownr_email_addr,
                    a.due,
                    a.start_dt
                FROM TB_API_KEY_MNGR a
                LEFT JOIN TB_CON_MST b ON a.cd = b.CD
                WHERE a.cd = %s
            """
            
            cursor.execute(query, (cd,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'cd': row[0],
                    'api_key': row[1],
                    'api_ownr_email_addr': row[2],
                    'due': row[3],
                    'start_dt': row[4]
                }
            return None
            
        except Exception as e:
            self.logger.error(f"Error selecting API key manager data by CD {cd}: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()

    def insert(self, cd: str, due: int, start_dt: str, api_ownr_email_addr: str = None, conn=None) -> bool:
        """Insert a new record into TB_API_KEY_MNGR"""
        try:
            if conn is None:
                conn = get_db_connection()
            cursor = conn.cursor()
            
            query = """
                INSERT INTO TB_API_KEY_MNGR (CD, DUE, START_DT, API_OWNR_EMAIL_ADDR)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    DUE = VALUES(DUE),
                    START_DT = VALUES(START_DT),
                    API_OWNR_EMAIL_ADDR = VALUES(API_OWNR_EMAIL_ADDR)
            """
            
            cursor.execute(query, (cd, due, start_dt, api_ownr_email_addr))
            conn.commit()
            
            self.logger.debug(f"Successfully inserted/updated API key manager record for CD: {cd}")
            return True
            
        except Exception as e:
            if conn is not None:
                conn.rollback()
            self.logger.error(f"Error inserting API key manager record: {e}")
            raise
        finally:
            if conn is None and 'conn' in locals():
                conn.close()

    def update(self, cd: str, due: int, start_dt: str, api_ownr_email_addr: str = None, conn=None) -> bool:
        """Update an existing record in TB_API_KEY_MNGR"""
        try:
            if conn is None:
                conn = get_db_connection()
            cursor = conn.cursor()
            
            query = """
                UPDATE TB_API_KEY_MNGR
                SET DUE = %s,
                    START_DT = %s,
                    API_OWNR_EMAIL_ADDR = %s
                WHERE CD = %s
            """
            
            cursor.execute(query, (due, start_dt, api_ownr_email_addr, cd))
            conn.commit()
            
            self.logger.debug(f"Successfully updated API key manager record for CD: {cd}")
            return True
            
        except Exception as e:
            if conn is not None:
                conn.rollback()
            self.logger.error(f"Error updating API key manager record: {e}")
            raise
        finally:
            if conn is None and 'conn' in locals():
                conn.close()

    def delete(self, cd: str) -> bool:
        """Delete a record from TB_API_KEY_MNGR"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            query = "DELETE FROM TB_API_KEY_MNGR WHERE CD = %s"
            cursor.execute(query, (cd,))
            conn.commit()
            
            self.logger.debug(f"Successfully deleted API key manager record for CD: {cd}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error deleting API key manager record: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()

    def select_mail_settings(self) -> Dict[str, Any]:
        """Select all mail settings from TB_API_KEY_MNGR_MAIL_SETT"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = "SELECT mail_tp, subject, from_email, body FROM TB_API_KEY_MNGR_MAIL_SETT"
            cursor.execute(query)
            rows = cursor.fetchall()
            
            settings = {}
            for row in rows:
                settings[row['mail_tp']] = {
                    'subject': row['subject'],
                    'from': row['from_email'],
                    'body': row['body']
                }
            
            self.logger.debug(f"Fetched {len(settings)} mail settings")
            return settings
            
        except Exception as e:
            self.logger.error(f"Error selecting mail settings: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()

    def upsert_mail_settings(self, mail_tp: str, subject: str, from_email: str, body: str) -> bool:
        """Insert or update mail settings in TB_API_KEY_MNGR_MAIL_SETT"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            query = """
                INSERT INTO TB_API_KEY_MNGR_MAIL_SETT (mail_tp, subject, from_email, body)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (mail_tp) DO UPDATE
                SET subject = EXCLUDED.subject,
                    from_email = EXCLUDED.from_email,
                    body = EXCLUDED.body,
                    upd_dt = NOW()
            """
            
            cursor.execute(query, (mail_tp, subject, from_email, body))
            conn.commit()
            
            self.logger.debug(f"Successfully upserted mail settings for: {mail_tp}")
            return True
            
        except Exception as e:
            if 'conn' in locals():
                conn.rollback()
            self.logger.error(f"Error upserting mail settings: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()

    def select_event_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Select event logs from tb_con_hist_evnt_log"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT 
                    evnt_id,
                    evnt_tp,
                    evnt_occr_time,
                    evnt_chg_row
                FROM tb_con_hist_evnt_log
                WHERE evnt_tp = 'mail_send'
                ORDER BY evnt_occr_time DESC
                LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            
            logs = []
            for row in rows:
                log_data = {
                    'evnt_id': row['evnt_id'],
                    'evnt_tp': row['evnt_tp'],
                    'sent_at': row['evnt_occr_time'].strftime('%Y-%m-%d %H:%M:%S') if row['evnt_occr_time'] else '-',
                }
                
                # Parse JSONB data
                if row['evnt_chg_row']:
                    import json
                    try:
                        chg_data = row['evnt_chg_row']
                        if isinstance(chg_data, str):
                            chg_data = json.loads(chg_data)
                        log_data['cd'] = chg_data.get('cd', '-')
                        log_data['to_email'] = chg_data.get('to_email', '-')
                        log_data['success'] = chg_data.get('success', False)
                        log_data['error_msg'] = chg_data.get('error_msg', '-')
                    except:
                        log_data['cd'] = '-'
                        log_data['to_email'] = '-'
                        log_data['success'] = False
                        log_data['error_msg'] = '-'
                else:
                    log_data['cd'] = '-'
                    log_data['to_email'] = '-'
                    log_data['success'] = False
                    log_data['error_msg'] = '-'
                
                logs.append(log_data)
            
            self.logger.debug(f"Fetched {len(logs)} event logs")
            return logs
            
        except Exception as e:
            self.logger.error(f"Error selecting event logs: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()

    def insert_event_log(self, cd: str, to_email: str, success: bool, error_msg: str = None) -> bool:
        """Insert event log into tb_con_hist_evnt_log"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            import json
            chg_data = json.dumps({
                'cd': cd,
                'to_email': to_email,
                'success': success,
                'error_msg': error_msg
            })
            
            query = """
                INSERT INTO tb_con_hist_evnt_log (evnt_tp, evnt_chg_row)
                VALUES ('mail_send', %s::jsonb)
            """
            
            cursor.execute(query, (chg_data,))
            conn.commit()
            
            self.logger.debug(f"Successfully inserted event log for CD: {cd}")
            return True
            
        except Exception as e:
            if 'conn' in locals():
                conn.rollback()
            self.logger.error(f"Error inserting event log: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()

    def select_cds_not_in_api_key_mngr(self, conn=None) -> List[Dict[str, Any]]:
        """Select all CD values from TB_MNGR_SETT that are not in TB_API_KEY_MNGR"""
        # Create a completely new method that handles connection properly
        data = []
        
        try:
            # Always create new connection
            if conn is None:
                local_conn = get_db_connection()
            else:
                local_conn = conn
            
            cursor = local_conn.cursor()
            
            query = """
                SELECT CD
                FROM TB_MNGR_SETT
                WHERE CD NOT IN (SELECT CD FROM TB_API_KEY_MNGR)
            """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            for row in rows:
                data.append({'cd': row[0]})
            
            self.logger.debug(f"Fetched {len(data)} CD values not in TB_API_KEY_MNGR")
            
        except Exception as e:
            self.logger.error(f"Error selecting CD values not in API key manager: {e}")
            raise
        finally:
            # Only close connection if we created it
            if conn is None and 'local_conn' in locals():
                try:
                    local_conn.close()
                except:
                    pass
        
        return data