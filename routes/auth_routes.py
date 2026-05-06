                       
from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template, flash, current_app, make_response
from flask_login import login_user, login_required, logout_user
from functools import wraps
import os
from datetime import datetime, timedelta
from msys.database import get_db_connection
from service.auth_service import AuthService
from service.password_service import PasswordService
from mapper.user_mapper import UserMapper
from service.dashboard_service import DashboardService

auth_bp = Blueprint('auth', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        current_app.logger.info(f"--- [DEBUG] admin_required: Checking permissions. User has: {user_permissions}")
        has_permission = 'mngr_sett' in user_permissions
        current_app.logger.info(f"--- [DEBUG] admin_required: Has 'mngr_sett' permission? {has_permission}")
        if not has_permission:
            current_app.logger.warning(f"--- [DEBUG] admin_required: Permission denied for user with permissions: {user_permissions}")
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def collection_schedule_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'collection_schedule' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def analysis_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'analysis' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def data_analysis_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'data_analysis' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def card_summary_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'card_summary' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def data_report_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'data_report' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def data_spec_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'data_spec' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def jandi_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'jandi' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def mapping_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'mapping' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def api_key_mngr_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'api_key_mngr' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def mngr_sett_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_permissions = session.get('user', {}).get('permissions', [])
        if 'mngr_sett' not in user_permissions:
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def check_password_change_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
                                                          
        if request.endpoint in ['auth.change_password', 'auth.logout']:
            return f(*args, **kwargs)
        
                                      
        is_admin = 'mngr_sett' in session.get('user', {}).get('permissions', [])
        if is_admin:
            return f(*args, **kwargs)
        
                                                         
        is_guest = session.get('user', {}).get('is_guest', False)
        if is_guest:
            return f(*args, **kwargs)
        
        if session.get('force_password_change'):
            flash("계속하려면 비밀번호를 변경해야 합니다.", "warning")
            return redirect(url_for('auth.change_password'))
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'user' in session:
        return redirect(url_for('dashboard.dashboard'))

    if request.method == 'POST':
        user_id = request.form.get('user_id')
        password = request.form.get('password')

        if not user_id or not password:
            flash("사용자 ID와 비밀번호를 모두 입력해주세요.", "error")
            return redirect(url_for('auth.login'))

        conn = get_db_connection()
        try:
            auth_service = AuthService(conn)
            dashboard_service = DashboardService(conn)
            user_info, message = auth_service.verify_user(user_id, password)

                                     
            try:
                status = 'AUTH_LOGIN_SUCCESS' if user_info else 'AUTH_LOGIN_FAIL'
                rqs_info = f"User '{user_id}' logged in successfully" if user_info else f"Failed login attempt for user '{user_id}': {message}"
                dashboard_service.save_event(con_id=None, job_id=None, status=status, rqs_info=rqs_info)
                conn.commit()
                current_app.logger.info(f"Login event saved for user '{user_id}': {status}")
            except Exception as e:
                current_app.logger.error(f"Failed to save login event log for user {user_id}: {e}")
                                        

            if user_info:
                                         
                                                                      
                acc_sts = user_info.get('acc_sts', 'APPROVED')
                
                             
                if acc_sts == 'DORMANT':
                    flash("휴면 상태입니다. 관리자에게 문의하세요.", "error")
                    current_app.logger.warning(f"DORMANT user login attempt: {user_id}")
                    return redirect(url_for('auth.login'))
                elif acc_sts == 'INACTIVE':
                    flash("비활성화 처리가 되었습니다. 관리자에게 문의하세요.", "error")
                    current_app.logger.warning(f"INACTIVE user login attempt: {user_id}")
                    return redirect(url_for('auth.login'))
                elif acc_sts == 'PENDING':
                    flash("계정 승인 대기 중입니다. 관리자에게 문의하세요.", "error")
                    current_app.logger.warning(f"PENDING user login attempt: {user_id}")
                    return redirect(url_for('auth.login'))
                                           

                                    
                                                                                   
                                                             
                permissions = user_info.get('permissions', [])
                if 'dashboard' not in permissions:
                    permissions.append('dashboard')
                if 'collection_schedule' not in permissions:
                    permissions.append('collection_schedule')
                user_info['permissions'] = permissions
                                      

                                  
                                                              
                                                          
                session.clear()
                                    
                
                                            
                                                           
                                                  
                try:
                    user_mapper = UserMapper(conn)
                    data_permissions = user_mapper.find_data_permissions_by_user_id(user_info['user_id'])
                    current_app.logger.info(f"DATA_PERMISSIONS_DIAGNOSIS: Fetched from DB: {data_permissions} (Type: {type(data_permissions)})")
                    
                    user_info['data_permissions'] = data_permissions
                                                        
                    current_app.logger.info(f"DATA_PERMISSIONS_DIAGNOSIS: About to be saved to session: {user_info['data_permissions']}")
                except Exception as e:
                    current_app.logger.error(f"Failed to load data permissions for user '{user_id}': {e}", exc_info=True)
                    user_info['data_permissions'] = []                     
                                              

                                                          
                if user_info.get('is_admin'):
                    if 'permissions' not in user_info:
                        user_info['permissions'] = []
                    if 'mngr_sett' not in user_info['permissions']:
                        user_info['permissions'].append('mngr_sett')
                        current_app.logger.info(f"Admin user '{user_id}' detected. Granting 'mngr_sett' permission.")

                from models.user import User
                user = User(user_id=user_info['user_id'], permissions=user_info.get('permissions', []))
                login_user(user)
                session['user'] = user_info                        
                
                                                           
                from flask import g
                g.user = user_info

                                  
                session.permanent = True
                
                                                
                                                                 
                default_session_minutes = int(os.getenv('DEFAULT_SESSION_LIFETIME_MINUTES', '20'))
                
                if 'mngr_sett' in user_info.get('permissions', []):
                                                                          
                    lifetime = current_app.config['PERMANENT_SESSION_LIFETIME']
                else:
                                                  
                    lifetime = timedelta(minutes=default_session_minutes)
                
                current_app.logger.info(f"--- [DEBUG] Login successful. Session user_info: {user_info}")
                session.pop('force_password_change', None)                           

                                                                
                session['expiry_time'] = (datetime.utcnow() + lifetime).isoformat()

                                                                                           
                if user_id == password:
                    user_permissions = session.get('user', {}).get('permissions', [])
                    is_admin = 'mngr_sett' in user_permissions
                                                               
                    if not is_admin:
                        session['force_password_change'] = True
                        flash("비밀번호를 변경해야 합니다. 초기화된 비밀번호는 안전하지 않습니다.", "warning")
                        return redirect(url_for('auth.change_password'))
                
                                                     
                try:
                    user_mapper = UserMapper(conn)
                    user_menus = user_mapper.find_user_menus_sorted(user_id)
                    
                    if user_menus:
                                                 
                        first_menu_url = user_menus[0].get('menu_url')
                        if first_menu_url:
                                                                   
                            return redirect(first_menu_url)
                        else:
                                                  
                            flash("접근 가능한 첫 페이지의 URL이 설정되지 않았습니다.")
                            logout_user()
                            session.clear()
                            return redirect(url_for('auth.login'))
                    else:
                                       
                        flash("접근 권한이 있는 메뉴가 없습니다. 관리자에게 문의하세요.")
                        return render_template("unauthorized.html")
                except Exception as e:
                    current_app.logger.error(f"메뉴 기반 리디렉션 처리 중 예외 발생: {e}", exc_info=True)
                    flash("로그인 후 페이지 이동 중 오류가 발생했습니다.")
                    logout_user()
                    session.clear()
                    return redirect(url_for('auth.login'))
                                                                      

            else:
                flash(message, 'error')
                return redirect(url_for('auth.login'))
        except Exception as e:
            current_app.logger.error(f"로그인 처리 중 예외 발생: {e}", exc_info=True)
            flash("로그인 중 오류가 발생했습니다. 다시 시도해주세요.", "error")
            return redirect(url_for('auth.login'))
    
                                  
    response = make_response(render_template('login.html'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0, private'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    flash("로그아웃되었습니다.", "success")
    return redirect(url_for('auth.login'))

@auth_bp.route('/register', methods=['POST'])
def register():
    user_id = request.form.get('user_id')
    password = request.form.get('password')
    password_confirm = request.form.get('password_confirm')

    if not all([user_id, password, password_confirm]):
        current_app.logger.warning(f"회원가입 실패: 필수 필드 누락 (user_id: {user_id})")
        flash("모든 필드를 입력해주세요.")
        return redirect(url_for('auth.login'))

    if password != password_confirm:
        current_app.logger.warning(f"회원가입 실패: 비밀번호 불일치 (user_id: {user_id})")
        flash("비밀번호가 일치하지 않습니다.")
        return redirect(url_for('auth.login'))

                                                                            
                      
                                                                                                     
        flash(message)
                                                

    try:
        conn = get_db_connection()
        user_mapper = UserMapper(conn)
        dashboard_service = DashboardService(conn)
        if user_mapper.find_by_id(user_id):
            current_app.logger.warning(f"회원가입 실패: 이미 존재하는 사용자 ID (user_id: {user_id})")
            flash("이미 존재하는 사용자 ID입니다.")
            return redirect(url_for('auth.login'))
        
        hashed_password = PasswordService.hash_password(password)

        user_mapper.save(user_id, hashed_password)
        current_app.logger.info(f"DB에 사용자 정보 저장 성공 (user_id: {user_id}, status: PENDING)")
        
                                   
        try:
            rqs_info = f"New user registration requested: '{user_id}'"
            dashboard_service.save_event(con_id=None, job_id=None, status='AUTH_REGISTER', rqs_info=rqs_info)
            current_app.logger.info(f"Registration event saved for user: {user_id}")
        except Exception as log_e:
            current_app.logger.error(f"Failed to save registration event log for user {user_id}: {log_e}")
                                           
        conn.commit()
        flash("회원가입 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.", "success")
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"회원가입 처리 중 예외 발생 (user_id: {user_id}): {e}", exc_info=True)
        flash(f"회원가입 중 오류가 발생했습니다: {e}")

    return redirect(url_for('auth.login'))

@auth_bp.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        user_id = session['user']['user_id']

        if not all([current_password, new_password, confirm_password]):
            flash("모든 필드를 입력해주세요.")
            return redirect(url_for('auth.change_password'))

        if new_password != confirm_password:
            flash("새 비밀번호가 일치하지 않습니다.")
            return redirect(url_for('auth.change_password'))

        try:
            conn = get_db_connection()
            auth_service = AuthService(conn)
            dashboard_service = DashboardService(conn)

                      
            is_admin = 'mngr_sett' in session.get('user', {}).get('permissions', [])

                                     
            if not is_admin:
                is_valid, message = PasswordService.validate_password_policy(new_password)
                if not is_valid:
                    flash(message)
                    return redirect(url_for('auth.change_password'))

                            
            success, message = auth_service.change_password(user_id, current_password, new_password)
            if not success:
                flash(message)
                return redirect(url_for('auth.change_password'))

                                       
            try:
                rqs_info = f"User '{user_id}' changed their password"
                dashboard_service.save_event(con_id=None, job_id=None, status='AUTH_CHANGE_PW', rqs_info=rqs_info)
                current_app.logger.info(f"Password change event saved for user: {user_id}")
            except Exception as log_e:
                current_app.logger.error(f"Failed to save password change event log for user {user_id}: {log_e}")
                                                  
            conn.commit()

                                                                   
            session.pop('force_password_change', None)

            flash("비밀번호가 성공적으로 변경되었습니다.", "success")
            return redirect(url_for('dashboard.dashboard'))                                                

        except Exception as e:
            conn.rollback()
            current_app.logger.error(f"비밀번호 변경 중 오류 발생 (user_id: {user_id}): {e}", exc_info=True)
            flash("비밀번호 변경 중 오류가 발생했습니다.")

                                      
    response = make_response(render_template('change_password.html'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0, private'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@auth_bp.route('/guest_login')
def guest_login():
    current_app.logger.info("=== GUEST LOGIN START ===")
               
    guest_user = {
        'user_id': 'guest',
        'permissions': ['collection_schedule'],              
        'data_permissions': [],             
        'is_guest': True
    }
    current_app.logger.info(f"게스트 사용자 생성: {guest_user}")

    from flask_login import login_user
    from models.user import User

    user = User(guest_user['user_id'], guest_user.get('permissions', []))
    current_app.logger.info(f"User 객체 생성: id={user.id}, permissions={user.permissions}")

    login_user(user)
    current_app.logger.info("login_user() 호출 완료")

    session['user'] = guest_user
    current_app.logger.info(f"세션에 사용자 저장: {session.get('user')}")

                     
    from flask import g
    g.user = guest_user
    current_app.logger.info(f"g.user 설정: {g.user}")

                              
    from datetime import datetime, timedelta
    import os
    default_session_minutes = int(os.getenv('DEFAULT_SESSION_LIFETIME_MINUTES', '20'))
    lifetime = timedelta(minutes=default_session_minutes)
    session.permanent = True
    session['expiry_time'] = (datetime.utcnow() + lifetime).isoformat()
    current_app.logger.info(f"세션 만료 시간 설정: {session.get('expiry_time')}")

    flash("게스트로 로그인되었습니다. 제한된 기능만 사용 가능합니다.", "info")
    current_app.logger.info("=== GUEST LOGIN END: 리다이렉트 to collection_schedule ===")
    return redirect(url_for('collection_schedule.collection_schedule') + '?guest=1')

@auth_bp.route('/request-reset-password', methods=['POST'])
def request_reset_password():
    data = request.json
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "사용자 ID를 입력해주세요."}), 400

    try:
        conn = get_db_connection()
        user_mapper = UserMapper(conn)
        dashboard_service = DashboardService(conn)
        user = user_mapper.find_by_id(user_id)
        if not user:
            return jsonify({"success": False, "message": "존재하지 않는 사용자입니다."}), 404
        
                                         
        user_mapper.update_status(user_id, 'PENDING_RESET')

                                       
        try:
            rqs_info = f"User '{user_id}' requested password reset"
            dashboard_service.save_event(con_id=None, job_id=None, status='AUTH_REQUEST_PW_RESET', rqs_info=rqs_info)
            current_app.logger.info(f"Password reset request event saved for user: {user_id}")
        except Exception as log_e:
            current_app.logger.error(f"Failed to save password reset request event log for user {user_id}: {log_e}")
                                              
        conn.commit()
            
        return jsonify({"success": True, "message": "비밀번호 초기화가 요청되었습니다. 관리자에게 문의하세요."})
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"비밀번호 초기화 요청 처리 중 오류 발생 (user_id: {user_id}): {e}", exc_info=True)
        return jsonify({"success": False, "message": "요청 처리 중 오류가 발생했습니다."}), 500
