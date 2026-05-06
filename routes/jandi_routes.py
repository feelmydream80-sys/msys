from flask import Blueprint, jsonify, render_template, request, session
import logging
import json
from datetime import date
from service.mst_service import ConMstService
from service.jandi_service import JandiService
from msys.database import get_db_connection
from routes.auth_routes import login_required
from routes.admin_routes import log_menu_access

bp = Blueprint('jandi', __name__, url_prefix='/')

@bp.route('/jandi')
@login_required
@log_menu_access
def jandi_page():
    """Jandi page."""
    user = session.get('user', {})
    is_admin = user.get('is_admin', False)
    return render_template('jandi.html', is_admin=is_admin)

@bp.route('/api/job-list')
def get_job_list():
    """API for Job ID list with server-side processing."""
    try:
        user = session.get('user')
        with get_db_connection() as conn:
            mst_service = ConMstService(conn)
                                   
            draw = int(request.args.get('draw', 0))
            start = int(request.args.get('start', 0))
            length = int(request.args.get('length', 10))
            search_value = request.args.get('search[value]', '')
            
                                       
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            all_data = request.args.get('allData', 'false').lower() == 'true'

            jobs, total_records, filtered_records = mst_service.get_paged_jobs(
                start, length, search_value, start_date, end_date, all_data, user=user
            )
            
            logging.info(f"get_job_list Service Result (jobs): {jobs}")
            logging.info(f"Data being sent to frontend (jobs): {jobs}")

            return jsonify({
                "draw": draw,
                "recordsTotal": total_records,
                "recordsFiltered": filtered_records,
                "data": jobs
            })
    except Exception as e:
        logging.error(f"Error in get_job_list: {e}", exc_info=True)
        return jsonify({"error": "Error fetching job list."}), 500

@bp.route('/api/job_mst_info')
def get_job_mst_info():
    """Job ID 리스트에 해당하는 마스터 상세정보를 dict로 반환"""
    try:
        with get_db_connection() as conn:
            mst_service = ConMstService(conn)
            job_ids_str = request.args.get('job_ids')
            if not job_ids_str:
                return jsonify({})
            
            job_ids = job_ids_str.split(',')
            
            mst_info = mst_service.get_job_mst_info(job_ids)
            
            return jsonify(mst_info)
    except Exception as e:
        logging.error(f"Error in get_job_mst_info: {e}", exc_info=True)
        return jsonify({"error": "Error fetching job master info."}), 500

@bp.route('/api/jandi-data')
@bp.route('/api/jandi/raw_data')                                      
def get_jandi_data():
    """API for Jandi heatmap data."""
    job_id = request.args.get('job_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    all_data = request.args.get('allData', 'false').lower() == 'true'

    if not all_data and not (start_date and end_date):
        return jsonify({"error": "Missing required parameters: start_date and end_date are required when allData is false"}), 400

    try:
        user = session.get('user')
        with get_db_connection() as conn:
            jandi_service = JandiService(conn)
            data = jandi_service.get_daily_job_counts(job_id, start_date, end_date, all_data, user=user)
            return jsonify(data)
    except Exception as e:
        logging.error(f"❌ API: Error in get_jandi_data: {e}", exc_info=True)
        return jsonify({"error": "Error fetching jandi data."}), 500
