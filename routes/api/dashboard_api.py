from flask import Blueprint, request, jsonify, session
import logging
from datetime import datetime, timedelta
import pytz
from ..auth_routes import login_required, check_password_change_required

from service.dashboard_service import DashboardService
from msys.database import get_db_connection
from utils.datetime_utils import convert_datetime_fields_to_kst_str

dashboard_api_bp = Blueprint('dashboard_api', __name__, url_prefix='/api/dashboard')

@dashboard_api_bp.route('/summary', methods=['GET'])
@login_required
@check_password_change_required
def get_dashboard_summary():
    """
    대시보드 요약 데이터를 제공하는 API.
    """
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            all_data_str = request.args.get('all_data', 'false')
            all_data = all_data_str.lower() == 'true'

            if not all_data:
                if not start_date_str or not end_date_str:
                    return jsonify({"message": "시작 및 종료 날짜가 필요합니다."}), 400
                try:
                    start_date_obj = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                    end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                    if start_date_obj > end_date_obj:
                        return jsonify({"message": "시작 날짜는 종료 날짜보다 빠를 수 없습니다."}), 400
                    
                    # Add one day to the end date to include all data of the selected day
                    end_date_obj += timedelta(days=1)
                    end_date_str = end_date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    return jsonify({"message": "날짜 형식이 유효하지 않습니다.YYYY-MM-DD 형식을 사용해주세요."}), 400

            user = session.get('user')
            summary_data = dashboard_service.get_summary(start_date_str, end_date_str, all_data, user=user)
            logging.info(f"[PIPELINE-7] API response data count before conversion: {len(summary_data)}")

            # Convert datetime objects to KST strings before jsonify
            convert_datetime_fields_to_kst_str(summary_data)
            logging.info(f"[PIPELINE-8] API response data count after conversion: {len(summary_data)}")
            # None 값을 빈 문자열로 변환
            for item in summary_data:
                for key, value in item.items():
                    if value is None:
                        item[key] = ''

            return jsonify(summary_data), 200
    except Exception as e:
        logging.error(f"❌ API: 대시보드 요약 데이터 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "데이터 조회 중 오류가 발생했습니다."}), 500

@dashboard_api_bp.route('/day-stats/<string:date_str>', methods=['GET'])
@login_required
@check_password_change_required
def get_day_stats_api(date_str):
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            # This service method might be deprecated or needs refactoring.
            # For now, assuming it might be removed or changed.
            # day_stats = dashboard_service.get_day_stats(date_str)
            # return jsonify(day_stats), 200
            return jsonify([]), 200 # Returning empty list as the service method was removed
    except Exception as e:
        logging.error(f"❌ API: 일별 통계 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "일별 통계 조회 중 오류가 발생했습니다."}), 500

@dashboard_api_bp.route('/min-max-dates', methods=['GET'])
@login_required
@check_password_change_required
def get_min_max_dates_api():
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            dates = dashboard_service.get_min_max_dates()
            return jsonify(dates or {"min_date": None, "max_date": None}), 200
    except Exception as e:
        logging.error(f"❌ API: 최소/최대 날짜 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "최소/최대 날짜 조회 중 오류가 발생했습니다."}), 500

@dashboard_api_bp.route('/event-log', methods=['GET'])
@login_required
@check_password_change_required
def get_event_log_api():
    """
    이벤트 로그 데이터를 제공하는 API.
    """
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            all_data_str = request.args.get('all_data', 'false')
            all_data = all_data_str.lower() == 'true'

            if not all_data:
                if not start_date_str or not end_date_str:
                    return jsonify({"message": "시작 및 종료 날짜가 필요합니다."}), 400
                try:
                    start_date_obj = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                    end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                    if start_date_obj > end_date_obj:
                        return jsonify({"message": "시작 날짜는 종료 날짜보다 빠를 수 없습니다."}), 400
                except ValueError:
                    return jsonify({"message": "날짜 형식이 유효하지 않습니다.YYYY-MM-DD 형식을 사용해주세요."}), 400

            user = session.get('user')
            event_log_data = dashboard_service.get_event_log(start_date_str, end_date_str, all_data, user=user)

            # Convert datetime objects to KST strings before jsonify
            convert_datetime_fields_to_kst_str(event_log_data)
            # None 값을 빈 문자열로 변환
            for item in event_log_data:
                for key, value in item.items():
                    if value is None:
                        item[key] = ''

            return jsonify(event_log_data), 200
    except Exception as e:
        logging.error(f"❌ API: 이벤트 로그 데이터 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "데이터 조회 중 오류가 발생했습니다."}), 500
