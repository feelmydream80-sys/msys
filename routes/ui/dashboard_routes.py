from flask import Blueprint, render_template, session, current_app, request
from functools import wraps
from ..auth_routes import login_required, check_password_change_required
from msys.database import get_db_connection
from dao.analytics_dao import AnalyticsDAO
from utils.datetime_utils import get_kst_now

dashboard_bp = Blueprint('dashboard', __name__)

def dashboard_required(f):
    """'dashboard' 권한을 확인하는 데코레이터"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session or 'dashboard' not in session['user'].get('permissions', []):
            return render_template("unauthorized.html")
        return f(*args, **kwargs)
    return decorated_function

def log_menu_access(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user_id = session.get('user', {}).get('user_id')
            endpoint = request.endpoint
            
            if user_id and endpoint:
                menu_to_log = endpoint  # 기본값으로 엔드포인트 이름 사용
                
                # 엔드포인트에서 메뉴 ID 추출 (예: 'dashboard.dashboard' -> 'dashboard')
                menu_id = endpoint.split('.')[0]

                # 앱 컨텍스트에 캐시된 메뉴 데이터에서 메뉴 이름 찾기
                menu_items = getattr(current_app, 'menu_items', [])
                menu_item = next((item for item in menu_items if item.get('menu_id') == menu_id), None)
                
                if menu_item and menu_item.get('menu_nm'):
                    menu_to_log = menu_item['menu_nm']
                else:
                    current_app.logger.warning(f"캐시에서 menu_id '{menu_id}'에 해당하는 메뉴 이름을 찾을 수 없습니다. 엔드포인트 '{endpoint}'를 기본값으로 사용합니다.")

                # 로그 삽입
                with get_db_connection() as conn:
                    analytics_dao = AnalyticsDAO(conn)
                    analytics_dao.insert_user_access_log(user_id, menu_to_log)
        except Exception as e:
            current_app.logger.error(f"메뉴 접근 로그 기록 실패 (엔드포인트: {request.endpoint}): {e}")
        
        return f(*args, **kwargs)
    return decorated_function

@dashboard_bp.route("/dashboard")
@login_required
@check_password_change_required
@log_menu_access
def dashboard():
    current_app.logger.info(f"--- [LOG] Initial access to root or dashboard route: {request.path}")
    user_permissions = session.get('user', {}).get('permissions', [])
    is_admin = 'mngr_sett' in user_permissions
    return render_template("dashboard.html", now=get_kst_now(), is_admin=is_admin)
