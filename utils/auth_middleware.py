from flask import g, session, redirect, url_for, flash, request, jsonify, render_template
from datetime import datetime
import os

# 메뉴 권한 매핑: 엔드포인트 -> 필요한 권한
MENU_PERMISSION_MAPPING = {
    # Analysis 메뉴
    'analysis.chart_analysis': 'chart_analysis',
    'analysis.data_analysis': 'data_analysis',

    # Dashboard 메뉴
    'dashboard.dashboard': 'dashboard',

    # Collection Schedule 메뉴
    'collection_schedule.collection_schedule': 'collection_schedule',

    # Card Summary 메뉴
    'card_summary.card_summary_page': 'card_summary',

    # Manager Settings 메뉴 (관리자 권한)
    'mngr_sett.mngr_sett_page': 'mngr_sett',

    # Data Spec 메뉴
    'data_spec.data_spec_page': 'data_spec',

    # Jandi 메뉴
    'jandi.jandi_page': 'jandi',

    # Mapping 메뉴
    'mapping.index': 'mapping',

    # Data Report 메뉴
    'data_report.data_report_page': 'data_report',
}

def setup_auth_middleware(app, auth_enabled=True):
    """
    인증 미들웨어를 설정합니다.

    Args:
        app: Flask 애플리케이션 인스턴스
        auth_enabled: 인증 활성화 여부
    """
    @app.before_request
    def check_auth():
        # 정적 파일 요청에 대한 로그는 생략하여 로그를 깔끔하게 유지
        if request.path.startswith('/static'):
            return

        app.logger.info(f"--- [AUTH] Checking auth for request: {request.method} {request.path} (Endpoint: {request.endpoint})")

        # 세션을 영구 세션으로 설정. PERMANENT_SESSION_LIFETIME에 설정된 시간 후에 만료됩니다.
        session.permanent = True

        if not auth_enabled:
            g.user = None
            app.logger.info("--- [AUTH] Auth is disabled. Skipping checks.")
            return

        g.user = session.get('user', None)
        app.logger.info(f"--- [AUTH] User in session: {g.user}")

        # Sliding Session: Update expiry time on each request if user is logged in
        if g.user:
            expiry_time_str = session.get('expiry_time')
            app.logger.info(f"--- [AUTH] Found expiry_time in session: {expiry_time_str}")

            # expiry_time이 없는 구형 세션은 강제 로그아웃
            if not expiry_time_str:
                session.clear()
                g.user = None
                flash("비정상적인 세션이 감지되어 로그아웃되었습니다. 다시 로그인해주세요.", "warning")
                app.logger.warning("--- [AUTH] Session exists without expiry_time. Forcing re-login.")
                return redirect(url_for('auth.login'))

            try:
                expiry_time = datetime.fromisoformat(expiry_time_str)
                now = datetime.utcnow()
                is_expired = now > expiry_time
                app.logger.info(f"--- [AUTH] Checking session expiry: Now='{now.isoformat()}', Expiry='{expiry_time.isoformat()}', IsExpired={is_expired}")

                if is_expired:
                    session.clear()
                    g.user = None
                    app.logger.info("--- [AUTH] Session expired. Clearing session.")

                    # API 요청에 대해서는 JSON 응답, 그 외에는 로그인 페이지로 리디렉션
                    if request.path.startswith('/api/'):
                        app.logger.warning("--- [AUTH] Unauthorized API access due to session expiration. Returning 401.")
                        return jsonify({"error": "Session expired"}), 401

                    flash("세션이 만료되었습니다. 다시 로그인해주세요.", "warning")
                    app.logger.info("--- [AUTH] Redirecting to login page due to session expiration.")
                    return redirect(url_for('auth.login'))
            except ValueError:
                app.logger.warning(f"--- [AUTH] Invalid expiry_time format: {expiry_time_str}. Forcing re-login.")
                session.clear()
                g.user = None
                flash("비정상적인 세션이 감지되어 로그아웃되었습니다. 다시 로그인해주세요.", "warning")
                return redirect(url_for('auth.login'))

            # 세션 만료 시간 갱신 로직 비활성화
            # new_expiry_time = (datetime.utcnow() + app.config['PERMANENT_SESSION_LIFETIME']).isoformat()
            # session['expiry_time'] = new_expiry_time
            # app.logger.info(f"--- [AUTH] Session expiry time refreshed to: {new_expiry_time}")

        if g.user and not g.user.get('user_id'):
            session.clear()
            g.user = None
            flash("비정상적인 세션이 감지되어 로그아웃되었습니다. 다시 로그인해주세요.", "warning")
            app.logger.warning("--- [AUTH] Invalid session detected. Clearing session and redirecting to login.")
            return redirect(url_for('auth.login'))

        excluded_endpoints = ['auth.login', 'auth.logout', 'auth.register', 'auth.request_reset_password', 'static', 'index']

        if g.user:
            app.logger.info(f"--- [AUTH] User is logged in. Checking permissions for path: {request.path}")

            # 메뉴 권한 체크
            endpoint = request.endpoint
            if endpoint in MENU_PERMISSION_MAPPING:
                required_permission = MENU_PERMISSION_MAPPING[endpoint]
                user_permissions = g.user.get('permissions', [])

                if required_permission not in user_permissions:
                    app.logger.warning(f"--- [AUTH] User '{g.user.get('user_id')}' lacks permission '{required_permission}' for endpoint '{endpoint}'")
                    if request.path.startswith('/api/'):
                        return jsonify({"error": f"권한이 없습니다: {required_permission}"}), 403
                    else:
                        return render_template("unauthorized.html")

            app.logger.info("--- [AUTH] Auth check passed for logged-in user.")
            return

        app.logger.info(f"--- [AUTH] User is not logged in. Endpoint is '{request.endpoint}'.")
        if request.endpoint in excluded_endpoints:
            app.logger.info("--- [AUTH] Endpoint is in exclusion list. Allowing access.")
            return

        if request.path.startswith('/api/'):
            app.logger.warning("--- [AUTH] Unauthorized API access attempt. Returning 401.")
            return jsonify({"error": "Authentication required"}), 401

        flash("로그인이 필요합니다.")
        app.logger.info("--- [AUTH] No user and not an excluded endpoint. Redirecting to login.")
        return redirect(url_for('auth.login'))
