"""TB_API_KEY_MNGR 서비스 레이어"""

from dao.api_key_mngr_dao import ApiKeyMngrDao
from dao.con_mst_dao import ConMstDAO
from msys.database import get_db_connection
import logging
from msys.mail_send import send_email, create_api_key_expiry_email, validate_email_address
from datetime import datetime

class ApiKeyMngrService:
    """TB_API_KEY_MNGR 서비스 클래스"""

    def __init__(self):
        """Initialize ApiKeyMngrService"""
        self.dao = ApiKeyMngrDao()
        self.logger = logging.getLogger(__name__)

    def get_all_api_key_mngr(self):
        """Get all API key manager records with expiry information"""
        try:
            self.logger.info("[API키관리-서비스] get_all_api_key_mngr 호출")
            data = self.dao.select_all()
            self.logger.info(f"[API키관리-서비스] DAO 조회 결과 - 데이터 건수: {len(data)}")

                                                     
            result = []
            today = self.dao.get_today_date()

            for item in data:
                if isinstance(item['start_dt'], str):
                    item['start_dt'] = datetime.strptime(item['start_dt'], '%Y-%m-%d').date()
                
                expiry_dt = datetime(item['start_dt'].year + item['due'], item['start_dt'].month, item['start_dt'].day).date() if item['start_dt'] else None
                days_remaining = (expiry_dt - today).days if expiry_dt else 0
                
                item['start_dt'] = item['start_dt'].isoformat() if item['start_dt'] else None
                item['expiry_dt'] = expiry_dt.isoformat() if expiry_dt else None
                item['days_remaining'] = days_remaining
                item['is_expiring_soon'] = days_remaining <= 30
                
                result.append(item)
            
                                             
            result.sort(key=lambda x: x['start_dt'], reverse=True)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error getting API key manager data: {e}")
            raise

    def update_cd_from_mngr_sett(self):
        """Update CD values in TB_API_KEY_MNGR from TB_MNGR_SETT"""
        try:
            added_cds = []
            updated_cds = []
            
                                                                        
            conn = get_db_connection()
            cds_not_in_api_key_mngr = self.dao.select_cds_not_in_api_key_mngr(conn)
            
                                                                      
            for cd_item in cds_not_in_api_key_mngr:
                cd = cd_item['cd']
                
                try:
                                                             
                    con_mst_dao = ConMstDAO(conn)
                    con_mst_data = con_mst_dao.get_mst_data_by_cd(cd)
                    
                    if con_mst_data:
                        start_dt = con_mst_data.get('update_dt')
                        if not start_dt:
                            self.logger.warning(f"No update_dt found for CD: {cd}, using current date")
                            start_dt = self.dao.get_today_date()
                        
                        self.dao.insert(
                            cd=cd,
                            due=1,                         
                            start_dt=start_dt,
                            api_ownr_email_addr='',                                
                            conn=conn
                        )
                        added_cds.append(cd)
                        self.logger.info(f"Successfully added CD: {cd}, start_dt: {start_dt}")
                    else:
                        self.logger.warning(f"No CON_MST data found for CD: {cd}")
                
                except Exception as e:
                    self.logger.error(f"Error processing CD {cd}: {e}")
            
            return {'added_cds': added_cds, 'updated_cds': updated_cds}
            
        except Exception as e:
            self.logger.error(f"Error updating CD values: {e}")
            raise
    
    def update_api_key_mngr_with_api_key(self, cd, due, start_dt, api_ownr_email_addr, api_key):
        """Update API key manager data including API key in TB_CON_MST"""
        try:
            conn = get_db_connection()
            
                                    
            self.dao.update(cd, due, start_dt, api_ownr_email_addr, conn)
            
                                                   
            con_mst_dao = ConMstDAO(conn)
            con_mst_data = con_mst_dao.get_mst_data_by_cd(cd)
            
            if con_mst_data:
                                    
                update_data = {
                    'item10': api_key
                }
                                                                        
                                                                                            
                full_update_data = {**con_mst_data, **update_data}
                con_mst_dao.update_mst_data(con_mst_data['cd_cl'], cd, full_update_data)
            
            conn.commit()
            self.logger.debug(f"Successfully updated API key manager and API key for CD: {cd}")
            return True
            
        except Exception as e:
            if 'conn' in locals():
                conn.rollback()
            self.logger.error(f"Error updating API key manager with API key: {e}")
            raise

    def get_mail_settings(self):
        """Get all mail settings"""
        try:
            return self.dao.select_mail_settings()
        except Exception as e:
            self.logger.error(f"Error getting mail settings: {e}")
            raise

    def save_mail_settings(self, settings):
        """Save mail settings"""
        try:
            for mail_tp in ['mail30', 'mail7', 'mail0']:
                if mail_tp in settings:
                    s = settings[mail_tp]
                    self.dao.upsert_mail_settings(
                        mail_tp=mail_tp,
                        subject=s.get('subject', ''),
                        from_email=s.get('from', ''),
                        body=s.get('body', '')
                    )
            return True
        except Exception as e:
            self.logger.error(f"Error saving mail settings: {e}")
            raise

    def get_event_logs(self, limit=100):
        """Get event logs"""
        try:
            return self.dao.select_event_logs(limit)
        except Exception as e:
            self.logger.error(f"Error getting event logs: {e}")
            raise

    def get_all_api_key_mngr_paged(self, page: int = 1, page_size: int = 10):
        """
        Get paginated API key manager records with expiry information (기존 함수 수정 아님 - 새 함수)
        
        :param page: 페이지 번호 (1부터 시작)
        :param page_size: 페이지당 데이터 수
        :return: dict with data, total_count, page, page_size, total_pages
        """
        try:
            self.logger.info(f"[API키관리-서비스] get_all_api_key_mngr_paged 호출 - page: {page}, page_size: {page_size}")
            
                         
            data = self.dao.select_all_paged(page, page_size)
            
                       
            total_count = self.dao.count_all()
            
                                                     
            result = []
            today = self.dao.get_today_date()
            
            for item in data:
                if isinstance(item['start_dt'], str):
                    item['start_dt'] = datetime.strptime(item['start_dt'], '%Y-%m-%d').date()
                
                expiry_dt = datetime(item['start_dt'].year + item['due'], item['start_dt'].month, item['start_dt'].day).date() if item['start_dt'] else None
                days_remaining = (expiry_dt - today).days if expiry_dt else 0
                
                item['start_dt'] = item['start_dt'].isoformat() if item['start_dt'] else None
                item['expiry_dt'] = expiry_dt.isoformat() if expiry_dt else None
                item['days_remaining'] = days_remaining
                item['is_expiring_soon'] = days_remaining <= 30
                
                result.append(item)
            
                                             
            result.sort(key=lambda x: x['start_dt'], reverse=True)
            
                         
            total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1
            
            return {
                'data': result,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages
            }
            
        except Exception as e:
            self.logger.error(f"Error getting paginated API key manager data: {e}")
            raise

    def get_all_api_key_mngr_paged_with_search(self, page: int = 1, page_size: int = 10, search_query: str = None):
        """
        Get paginated API key manager records with search (기존 함수 수정 아님 - 새 함수)
        
        :param page: 페이지 번호 (1부터 시작)
        :param page_size: 페이지당 데이터 수
        :param search_query: 검색어 (CD, 명칭, API 키에서 검색)
        :return: dict with data, total_count, page, page_size, total_pages
        """
        try:
            self.logger.info(f"[API키관리-서비스] get_all_api_key_mngr_paged_with_search 호출 - page: {page}, page_size: {page_size}, search: {search_query}")
            
                                                    
            data, total_count = self.dao.select_all_paged_with_search(page, page_size, search_query)
            
                                                     
            result = []
            today = self.dao.get_today_date()
            
            for item in data:
                if isinstance(item['start_dt'], str):
                    item['start_dt'] = datetime.strptime(item['start_dt'], '%Y-%m-%d').date()
                
                expiry_dt = datetime(item['start_dt'].year + item['due'], item['start_dt'].month, item['start_dt'].day).date() if item['start_dt'] else None
                days_remaining = (expiry_dt - today).days if expiry_dt else 0
                
                item['start_dt'] = item['start_dt'].isoformat() if item['start_dt'] else None
                item['expiry_dt'] = expiry_dt.isoformat() if expiry_dt else None
                item['days_remaining'] = days_remaining
                item['is_expiring_soon'] = days_remaining <= 30
                
                result.append(item)
            
                                             
            result.sort(key=lambda x: x['start_dt'], reverse=True)
            
                         
            total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1
            
            return {
                'data': result,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages
            }
            
        except Exception as e:
            self.logger.error(f"Error getting paginated API key manager data with search: {e}")
            raise

    def send_expiry_notification(self, cds):
        """
        Send API key expiry notification emails for selected CDs
        Following the same pattern as Airflow's ServiceMonitor.write_email() and send_emails()
        
        :param cds: List of CD strings to send notifications for
        :return: dict with success/failure results
        """
        results = {
            'success': [],
            'failed': [],
            'skipped': []
        }
        
        try:
                                  
            all_data = self.get_all_api_key_mngr()
            
                                           
            target_data = [item for item in all_data if item['cd'] in cds]
            
                               
            mail_settings = {}
            try:
                settings_list = self.get_mail_settings()
                for s in settings_list:
                    mail_settings[s['mail_tp']] = {
                        'subject': s.get('subject', ''),
                        'body': s.get('body', '')
                    }
            except Exception as e:
                self.logger.warning(f"Failed to load mail settings: {e}")
            
            for api_key_data in target_data:
                                        
                email_addr = api_key_data.get('api_ownr_email_addr', '')
                if not validate_email_address(email_addr):
                    self.logger.warning(f"Invalid email address for CD {api_key_data['cd']}: {email_addr}")
                    results['skipped'].append({
                        'cd': api_key_data['cd'],
                        'reason': f'Invalid email: {email_addr}'
                    })
                                           
                    try:
                        self.dao.insert_event_log(
                            cd=api_key_data['cd'],
                            to_email=email_addr,
                            success=False,
                            error_msg=f'Invalid email: {email_addr}'
                        )
                    except:
                        pass
                    continue
                
                                    
                days_remaining = api_key_data.get('days_remaining', 999)
                if days_remaining <= 0:
                    mail_tp = 'mail0'
                elif days_remaining <= 7:
                    mail_tp = 'mail7'
                elif days_remaining <= 30:
                    mail_tp = 'mail30'
                else:
                    mail_tp = 'mail30'       
                
                                  
                mail_setting = mail_settings.get(mail_tp, {})
                subject_template = mail_setting.get('subject', None) or None
                body_template = mail_setting.get('body', None) or None
                
                                                              
                subject, body = create_api_key_expiry_email(
                    api_key_data,
                    subject_template=subject_template,
                    body_template=body_template
                )
                
                                                                         
                try:
                    success, error_msg = send_email(
                        to=email_addr,
                        subject=subject,
                        html_content=body
                    )
                    
                    if success:
                        self.logger.info(f"Email sent successfully for CD: {api_key_data['cd']} to {email_addr}")
                        results['success'].append({
                            'cd': api_key_data['cd'],
                            'email': email_addr
                        })
                                               
                        try:
                            self.dao.insert_event_log(
                                cd=api_key_data['cd'],
                                to_email=email_addr,
                                success=True
                            )
                        except:
                            pass
                    else:
                        results['failed'].append({
                            'cd': api_key_data['cd'],
                            'reason': error_msg or 'send_email returned False'
                        })
                                              
                        try:
                            self.dao.insert_event_log(
                                cd=api_key_data['cd'],
                                to_email=email_addr,
                                success=False,
                                error_msg=error_msg or 'send_email returned False'
                            )
                        except:
                            pass
                        
                except Exception as e:
                    self.logger.error(f"Failed to send email for CD {api_key_data['cd']}: {str(e)}")
                    results['failed'].append({
                        'cd': api_key_data['cd'],
                        'reason': str(e)
                    })
                                          
                    try:
                        self.dao.insert_event_log(
                            cd=api_key_data['cd'],
                            to_email=email_addr,
                            success=False,
                            error_msg=str(e)
                        )
                    except:
                        pass
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error in send_expiry_notification: {str(e)}")
            raise

    def batch_update_api_key_mngr(self, cds, api_key, due=None, start_dt=None, api_ownr_email_addr=None):
        """
        선택된 CD들에 대해 API 키 정보를 일괄 수정
        
        :param cds: CD 목록 (list)
        :param api_key: API 값 (필수)
        :param due: 기간 (선택)
        :param start_dt: 등록일 (선택)
        :param api_ownr_email_addr: 책임자 이메일 (선택)
        :return: dict with success/failure results
        """
        results = {
            'success': [],
            'failed': []
        }
        
        for cd in cds:
            try:
                # 기존 데이터 조회하여 선택되지 않은 필드는 기존 값 유지
                existing = self.dao.select_by_cd(cd)
                if not existing:
                    results['failed'].append({
                        'cd': cd,
                        'reason': '해당 CD를 찾을 수 없습니다.'
                    })
                    continue
                
                update_due = due if due is not None else existing.get('due', 1)
                update_start_dt = start_dt if start_dt is not None else existing.get('start_dt')
                update_email = api_ownr_email_addr if api_ownr_email_addr is not None else existing.get('api_ownr_email_addr', '')
                
                self.update_api_key_mngr_with_api_key(
                    cd=cd,
                    due=update_due,
                    start_dt=update_start_dt,
                    api_ownr_email_addr=update_email,
                    api_key=api_key
                )
                
                results['success'].append(cd)
                self.logger.info(f"[API키관리-일괄수정] 성공: {cd}")
                
            except Exception as e:
                self.logger.error(f"[API키관리-일괄수정] 실패: {cd} - {str(e)}")
                results['failed'].append({
                    'cd': cd,
                    'reason': str(e)
                })
        
        return results
