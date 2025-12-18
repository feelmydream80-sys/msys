# routes/data_spec_routes.py
from flask import Blueprint, request, jsonify, render_template, session, current_app
import logging
from functools import wraps
from service.data_spec_service import DataSpecService
from msys.database import get_db_connection
from dao.analytics_dao import AnalyticsDAO
from routes.auth_routes import data_spec_required

bp = Blueprint('data_spec', __name__, url_prefix='/')

def log_menu_access(f):
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

# =============================================
# 데이터 명세서 (Data Specification)
# =============================================
@bp.route('/data_spec')
@log_menu_access
def data_spec_page():
    """데이터 명세서 페이지를 렌더링합니다."""
    return render_template('data_spec.html')

@bp.route('/api/data-spec', methods=['GET', 'POST'])
def handle_data_specs():
    """GET: 모든 명세서 목록을 조회합니다. POST: 새 명세서를 생성합니다."""
    if request.method == 'GET':
        try:
            with get_db_connection() as conn:
                data_spec_service = DataSpecService(conn)
                specs = data_spec_service.get_all_specs()
                return jsonify(specs), 200
        except Exception as e:
            logging.error(f"Error fetching all data specs: {e}", exc_info=True)
            return jsonify({"message": "Error fetching data specifications."}), 500
    
    elif request.method == 'POST':
        try:
            with get_db_connection() as conn:
                data_spec_service = DataSpecService(conn)
                data = request.json
                spec_data = data.get('spec', {})
                params_data = data.get('params', [])
                
                spec_id = data_spec_service.create_spec(spec_data, params_data)
                conn.commit()
                return jsonify({"message": "Data specification created successfully.", "spec_id": spec_id}), 201
        except ValueError as e:
            logging.warning(f"Failed to create spec: {e}")
            return jsonify({"message": str(e)}), 400 # Bad Request
        except Exception as e:
            logging.error(f"Error creating data spec: {e}", exc_info=True)
            return jsonify({"message": "Error creating data specification."}), 500

@bp.route('/api/scrape-spec', methods=['POST'])
def scrape_spec_from_url():
    """URL에서 명세서 정보를 스크래핑합니다."""
    url = request.json.get('url')
    if not url:
        return jsonify({"message": "URL is required."}), 400
    try:
        with get_db_connection() as conn:
            data_spec_service = DataSpecService(conn)
            spec_data = data_spec_service.scrape_spec_from_url(url)
            return jsonify(spec_data), 200
    except Exception as e:
        logging.error(f"Error scraping spec from {url}: {e}", exc_info=True)
        return jsonify({"message": f"Error scraping spec: {e}"}), 500

@bp.route('/api/data-spec/check-name', methods=['GET'])
def check_data_spec_name():
    """데이터 명세서 이름의 중복 여부를 확인합니다."""
    data_name = request.args.get('data_name')
    spec_id_str = request.args.get('spec_id')
    spec_id = int(spec_id_str) if spec_id_str and spec_id_str.isdigit() else None

    if not data_name:
        return jsonify({"exists": False}), 200 # 이름이 없으면 중복이 아님

    try:
        with get_db_connection() as conn:
            data_spec_service = DataSpecService(conn)
            exists = data_spec_service.check_name_exists(data_name, spec_id)
            return jsonify({"exists": exists}), 200
    except Exception as e:
        logging.error(f"Error checking data spec name: {e}", exc_info=True)
        return jsonify({"message": "Error checking name."}), 500

@bp.route('/api/data-spec/<int:spec_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_data_spec_by_id(spec_id):
    """GET: 특정 명세서 상세 정보 조회. PUT: 특정 명세서 수정. DELETE: 특정 명세서 삭제."""
    if request.method == 'GET':
        try:
            with get_db_connection() as conn:
                data_spec_service = DataSpecService(conn)
                spec = data_spec_service.get_spec_by_id(spec_id)
                if not spec:
                    return jsonify({"message": "Data specification not found."}), 404
                return jsonify(spec), 200
        except Exception as e:
            logging.error(f"Error fetching data spec {spec_id}: {e}", exc_info=True)
            return jsonify({"message": "Error fetching data specification."}), 500
    
    elif request.method == 'PUT':
        try:
            with get_db_connection() as conn:
                data_spec_service = DataSpecService(conn)
                data = request.json
                spec_data = data.get('spec', {})
                params_data = data.get('params', [])
                
                success = data_spec_service.update_spec(spec_id, spec_data, params_data)
                if not success:
                    return jsonify({"message": "Data specification not found or could not be updated."}), 404
                conn.commit()
                return jsonify({"message": "Data specification updated successfully."}), 200
        except ValueError as e:
            logging.warning(f"Failed to update spec {spec_id}: {e}")
            return jsonify({"message": str(e)}), 400 # Bad Request
        except Exception as e:
            logging.error(f"Error updating data spec {spec_id}: {e}", exc_info=True)
            return jsonify({"message": "Error updating data specification."}), 500

    elif request.method == 'DELETE':
        try:
            with get_db_connection() as conn:
                data_spec_service = DataSpecService(conn)
                data = request.get_json(silent=True) or {}
                password = data.get('password')

                # 비밀번호가 없거나 빈 문자열인 경우 None으로 처리
                if not password:
                    password = None

                success = data_spec_service.delete_spec(spec_id, password)
                if not success:
                    return jsonify({"message": "Data specification not found or could not be deleted."}), 404
                conn.commit()
                return jsonify({"message": "Data specification deleted successfully."}), 200
        except ValueError as e:
            logging.warning(f"Failed to delete spec {spec_id}: {e}")
            return jsonify({"message": str(e)}), 403 # Forbidden
        except Exception as e:
            logging.error(f"Error deleting data spec {spec_id}: {e}", exc_info=True)
            return jsonify({"message": "Error deleting data specification."}), 500
