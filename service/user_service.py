import logging
from flask import g, session
from mapper.user_mapper import UserMapper
from service.dashboard_service import DashboardService
from msys.database import get_db_connection
from service.password_service import PasswordService
from msys.column_mapper import reload_mappings

class UserService:
    def __init__(self, db_connection):
        self.conn = db_connection
        self.user_mapper = UserMapper(db_connection)
        self.dashboard_service = DashboardService(db_connection)

    def get_all_users_with_permissions(self, search_term=None):
        """
        모든 사용자 목록과 각 사용자의 권한 정보를 반환합니다.
        검색 및 정렬 기능이 포함되어 있습니다.
        """
        try:
            reload_mappings()
            users = self.user_mapper.find_all()
            menus = self.user_mapper.find_all_menus()
            
            all_permissions = self.user_mapper.find_all_permissions()

            permissions_map = {}
            for p in all_permissions:
                user_id = p['user_id']
                if user_id not in permissions_map:
                    permissions_map[user_id] = []
                permissions_map[user_id].append(p['menu_id'])

            for user in users:
                user_permissions = permissions_map.get(user['user_id'], [])
                user['permissions'] = user_permissions
                user['is_admin'] = 'mngr_sett' in user_permissions
            
                                      
            if search_term:
                users = [
                    user for user in users
                    if search_term.lower() in user['user_id'].lower()
                ]

                                        
            users.sort(
                key=lambda u: (u['is_admin'], u.get('acc_cre_dt') or '1900-01-01'),
                reverse=True
            )

            return {"users": users, "menus": menus}
        except Exception as e:
            logging.error(f"❌ Service: 사용자 목록 조회 실패: {e}", exc_info=True)
            raise

    def approve_user(self, user_id):
        """사용자를 승인합니다. (비밀번호는 변경하지 않습니다.)"""
        try:
                                   
            self.user_mapper.update_status(user_id, 'APPROVED')
                                                 
                                                                      
                                                                        
            
            self._log_user_event(user_id, 'AUTH_APPROVE', f"User '{user_id}' approved by admin")
            
            logging.info(f"✅ Service: 사용자 '{user_id}'가 승인되었습니다.")
        except Exception as e:
            logging.error(f"❌ Service: 사용자 승인 실패: {e}", exc_info=True)
            raise

    def reject_user(self, user_id):
        """사용자 가입 신청을 거절하고 데이터베이스에서 삭제합니다."""
        try:
            self.user_mapper.delete_by_id(user_id)
            self._log_user_event(user_id, 'AUTH_REJECT', f"User '{user_id}' rejected by admin")
            logging.info(f"✅ Service: 사용자 '{user_id}'의 가입 신청이 거절되어 삭제되었습니다.")
        except Exception as e:
            logging.error(f"❌ Service: 사용자 거절 실패: {e}", exc_info=True)
            raise

    def delete_user(self, user_id):
        """관리자가 승인된 사용자를 삭제합니다."""
        try:
            self.user_mapper.delete_by_id(user_id)
            self._log_user_event(user_id, 'AUTH_DELETE', f"User '{user_id}' deleted by admin")
            logging.info(f"✅ Service: 사용자 '{user_id}'가 삭제되었습니다.")
        except Exception as e:
            logging.error(f"❌ Service: 사용자 삭제 실패: {e}", exc_info=True)
            raise

    def reset_password(self, user_id):
        """사용자 비밀번호를 ID와 동일하게 초기화합니다."""
        try:
            hashed_password = PasswordService.hash_password(user_id)
            self.user_mapper.update_password(user_id, hashed_password)
            self._log_user_event(user_id, 'AUTH_RESET_PW', f"Password for user '{user_id}' reset by admin")
            logging.info(f"✅ Service: 사용자 '{user_id}'의 비밀번호가 초기화되었습니다.")
        except Exception as e:
            logging.error(f"❌ Service: 비밀번호 초기화 실패: {e}", exc_info=True)
            raise

    def update_permissions(self, user_id, menu_ids):
        """사용자의 메뉴 접근 권한을 업데이트합니다."""
        try:
            self.user_mapper.update_user_permissions(user_id, menu_ids)
            
                       
            log_message = f"Permissions for user '{user_id}' updated by admin. New permissions: {menu_ids}"
            self._log_user_event(user_id, 'AUTH_UPDATE_PERM', log_message)
            
            logging.info(f"✅ Service: 사용자 '{user_id}'의 권한이 업데이트되었습니다.")
        except Exception as e:
                                                    
            error_msg = str(e).lower()
                                                  
            if 'foreign key constraint' in error_msg or 'violates foreign key' in error_msg or 'foreign key violation' in error_msg:
                logging.error(f"❌ Service: 사용자 권한 업데이트 실패 (잘못된 menu_id): {e}", exc_info=True)
                                                             
                raise ValueError("존재하지 않는 메뉴 ID가 포함되어 있어 권한을 업데이트할 수 없습니다.")
            
            logging.error(f"❌ Service: 사용자 권한 업데이트 실패: {e}", exc_info=True)
                                       
            raise

    def _log_user_event(self, user_id, status, message):
        """사용자 관련 이벤트를 로그에 기록합니다."""
        try:
                                                   
            admin_user_id = session.get('user', {}).get('user_id', 'UNKNOWN_ADMIN')
            rqs_info = f"{message} by '{admin_user_id}'"
            self.dashboard_service.save_event(con_id=None, job_id=user_id, status=status, rqs_info=rqs_info)
            logging.info(f"Event '{status}' saved for user: {user_id}")
        except Exception as log_e:
            logging.error(f"Failed to save event log for user {user_id}: {log_e}", exc_info=True)
                                              
                                   
            logging.warning(f"Could not log event for user {user_id} due to: {log_e}")
