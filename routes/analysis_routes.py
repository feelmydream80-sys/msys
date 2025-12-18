from flask import Blueprint, render_template, session, request, current_app
import logging

from .auth_routes import login_required, check_password_change_required, analysis_required, data_analysis_required
from msys.database import get_db_connection
from dao.analytics_dao import AnalyticsDAO

analysis_bp = Blueprint('analysis', __name__)

def log_menu_access(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user_id = session.get('user', {}).get('user_id')
            if user_id:
                menu_name = request.endpoint
                
                with get_db_connection() as conn:
                    analytics_dao = AnalyticsDAO(conn)
                    analytics_dao.insert_user_access_log(user_id, menu_name)
        except Exception as e:
            current_app.logger.error(f"Failed to log menu access for endpoint {request.endpoint}: {e}")
        
        return f(*args, **kwargs)
    return decorated_function

@analysis_bp.route("/chart_analysis")
@login_required
@check_password_change_required
@log_menu_access
def chart_analysis():
    logging.info("Serving chart_analysis.html")
    return render_template("chart_analysis.html")

@analysis_bp.route("/data_analysis")
@login_required
@check_password_change_required
@log_menu_access
def data_analysis():
    logging.info("Serving data_analysis.html")
    user = session.get('user', {})
    is_admin = user.get('is_admin', False)
    return render_template("data_analysis.html", is_admin=is_admin)
