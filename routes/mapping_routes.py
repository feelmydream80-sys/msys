from flask import Blueprint, request, jsonify, render_template, session, current_app
import logging
from functools import wraps

from service.mapping_service import MappingService
from .auth_routes import login_required
from msys.database import get_db_connection
from dao.analytics_dao import AnalyticsDAO

mapping_bp = Blueprint('mapping', __name__, url_prefix='/mapping')

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

@mapping_bp.route('/')
@login_required
@log_menu_access
def index():
    """컬럼 매핑 관리 페이지를 렌더링합니다."""
    return render_template('mapping_management.html')

@mapping_bp.route('/api/all', methods=['GET'])
@login_required
def get_all_mappings():
    """모든 컬럼 매핑 정보를 반환합니다."""
    try:
        with get_db_connection() as conn:
            mapping_service = MappingService(conn)
            mappings = mapping_service.get_all_mappings()
            return jsonify(mappings)
    except Exception as e:
        logging.error(f"매핑 정보 조회 실패: {e}", exc_info=True)
        return jsonify({"error": "매핑 정보 조회에 실패했습니다."}), 500

@mapping_bp.route('/api/unmapped', methods=['GET'])
@login_required
def get_unmapped_columns():
    """매핑되지 않은 컬럼 목록을 반환합니다."""
    try:
        with get_db_connection() as conn:
            mapping_service = MappingService(conn)
            unmapped_columns = mapping_service.get_unmapped_columns()
            return jsonify(unmapped_columns)
    except Exception as e:
        logging.error(f"매핑되지 않은 컬럼 조회 실패: {e}", exc_info=True)
        return jsonify({"error": "매핑되지 않은 컬럼 조회에 실패했습니다."}), 500

@mapping_bp.route('/api/add', methods=['POST'])
@login_required
def add_mapping():
    """새로운 매핑을 추가합니다."""
    try:
        with get_db_connection() as conn:
            mapping_service = MappingService(conn)
            mapping_data = request.json
            mapping_service.add_mapping(mapping_data)
            conn.commit()
            return jsonify({"message": "매핑이 성공적으로 추가되었습니다."}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"매핑 추가 실패: {e}", exc_info=True)
        return jsonify({"error": "매핑 추가에 실패했습니다."}), 500

@mapping_bp.route('/api/update', methods=['POST'])
@login_required
def update_mapping():
    """기존 매핑을 업데이트합니다."""
    try:
        with get_db_connection() as conn:
            mapping_service = MappingService(conn)
            mapping_data = request.json
            mapping_service.update_mapping(mapping_data)
            conn.commit()
            return jsonify({"message": "매핑이 성공적으로 업데이트되었습니다."})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"매핑 업데이트 실패: {e}", exc_info=True)
        return jsonify({"error": "매핑 업데이트에 실패했습니다."}), 500

@mapping_bp.route('/api/delete/<int:mapp_id>', methods=['DELETE'])
@login_required
def delete_mapping(mapp_id):
    """매핑을 삭제합니다."""
    try:
        with get_db_connection() as conn:
            mapping_service = MappingService(conn)
            mapping_service.delete_mapping(mapp_id)
            conn.commit()
            return jsonify({"message": "매핑이 성공적으로 삭제되었습니다."})
    except Exception as e:
        logging.error(f"매핑 삭제 실패: {e}", exc_info=True)
        return jsonify({"error": "매핑 삭제에 실패했습니다."}), 500
