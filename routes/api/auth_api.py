from flask import Blueprint, request, jsonify, session
from datetime import datetime
from service.password_service import PasswordService
from routes.auth_routes import login_required

auth_api_bp = Blueprint('auth_api', __name__, url_prefix='/api/auth')

@auth_api_bp.route('/status', methods=['GET'])
def get_auth_status():
    if 'user' in session:
        user_info = session['user']
        safe_user_info = {
            'user_id': user_info.get('user_id'),
            'permissions': user_info.get('permissions', []),
            'data_permissions': user_info.get('data_permissions', [])
        }

        seconds_remaining = 0
        expiry_time_str = session.get('expiry_time')
        if expiry_time_str:
            try:
                # The isoformat string might have microseconds, which fromisoformat handles.
                expiry_dt = datetime.fromisoformat(expiry_time_str)
                now_utc = datetime.utcnow()
                time_diff = expiry_dt - now_utc
                seconds_remaining = max(0, time_diff.total_seconds())
            except ValueError:
                # Handle cases where the string might not be a valid ISO format
                seconds_remaining = 0

        response_data = {
            'isLoggedIn': True,
            'user': safe_user_info,
            'seconds_remaining': seconds_remaining
        }
        return jsonify(response_data)
    else:
        return jsonify({'isLoggedIn': False, 'error': 'User not authenticated'}), 401

@auth_api_bp.route('/validate-password', methods=['POST'])
@login_required
def validate_password():
    data = request.json
    password = data.get('password')
    if not password:
        return jsonify({"is_valid": False, "message": "비밀번호를 입력해주세요."}), 400

    is_valid, message = PasswordService.validate_password_policy(password)
    return jsonify({"is_valid": is_valid, "message": message})
