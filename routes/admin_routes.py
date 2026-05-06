from flask import Blueprint, render_template, jsonify, request, session, current_app, send_file
from functools import wraps
from .auth_routes import login_required, admin_required
from dao.analytics_dao import AnalyticsDAO
from dao.mngr_sett_dao import MngrSettDAO
from service.dashboard_service import DashboardService
from msys.database import get_db_connection
import logging
import os
from datetime import datetime
from urllib.parse import quote
                 
                        
                                                                        

admin_bp = Blueprint('admin', __name__)

def log_menu_access(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        conn = None
        try:
            user_id = session.get('user', {}).get('user_id')
            if user_id:
                url = request.path
                
                                         
                conn = get_db_connection()
                
                          
                mngr_sett_dao = MngrSettDAO(conn)
                menu = mngr_sett_dao.get_menu_by_url(url)
                
                                                 
                menu_to_log = menu['menu_nm'] if menu and menu.get('menu_nm') else url
                if not (menu and menu.get('menu_nm')):
                    current_app.logger.warning(f"[ACCESS_LOG] Menu name not found for URL '{url}'. Using URL itself.")
                else:
                    current_app.logger.debug(f"[ACCESS_LOG] Found menu name '{menu_to_log}' for URL '{url}'")
                
                                              
                analytics_dao = AnalyticsDAO(conn)
                analytics_dao.insert_user_access_log(user_id, menu_to_log)
                current_app.logger.info(f"[ACCESS_LOG] Success: User '{user_id}' accessed '{menu_to_log}' (URL: {url})")
        
        except Exception as e:
            current_app.logger.error(f"[ACCESS_LOG_ERROR] Failed to log menu access for URL {request.path}: {type(e).__name__}: {e}", exc_info=True)
                                                                
        
        finally:
                                                    
            pass
        
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/api/statistics/config', methods=['GET'])
@login_required
def get_statistics_config():
    """
    통계 필터에 필요한 설정 데이터(연도, 메뉴 목록)를 반환합니다.
    """
    if 'mngr_sett' not in session.get('user', {}).get('permissions', []):
        return jsonify({'error': '권한이 없습니다.'}), 403
    conn = None
    try:
        conn = get_db_connection()
        analytics_dao = AnalyticsDAO(conn)
        
        available_years_months = analytics_dao.get_available_years_months()
        years = sorted(list(set(item['year'] for item in available_years_months)), reverse=True)

        mngr_sett_dao = MngrSettDAO(conn)
        menus = mngr_sett_dao.get_all_menu_settings()
        
        return jsonify({
            'years': years,
            'menus': menus
        })
    except Exception as e:
        logging.error(f"Error fetching statistics config: {e}", exc_info=True)
        return jsonify({'error': 'Failed to load configuration data'}), 500
    finally:
        if conn:
            conn.close()

@admin_bp.route('/api/statistics/recent_date')
@login_required
def get_recent_data_date():
    """
    가장 최근 접속 데이터가 있는 날짜를 반환합니다.
    """
    if 'mngr_sett' not in session.get('user', {}).get('permissions', []):
        return jsonify({'error': '권한이 없습니다.'}), 403
    conn = None

    try:
        conn = get_db_connection()
        analytics_dao = AnalyticsDAO(conn)

                             
        recent_date = analytics_dao.get_most_recent_data_date()
        return jsonify({'recent_date': recent_date})

    except Exception as e:
        logging.error(f"Error fetching recent data date: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@admin_bp.route('/api/statistics')
@login_required
def get_statistics():
    """
    기간별 통계 데이터를 반환합니다.
    """
    if 'mngr_sett' not in session.get('user', {}).get('permissions', []):
        return jsonify({'error': '권한이 없습니다.'}), 403
    view_type = request.args.get('view_type', 'daily')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    year = request.args.get('year')
    month = request.args.get('month')
    menu_nm = request.args.get('menu_nm', 'all')                        
    conn = None

    try:
        conn = get_db_connection()
        analytics_dao = AnalyticsDAO(conn)
        
        if view_type == 'weekly_monthly':
            if not year:
                return jsonify({'error': 'Year is required for weekly/monthly view'}), 400
            
                       
            weekly_data = analytics_dao.get_menu_access_stats_weekly(year, menu_nm)
                                
            site_unique_users = analytics_dao.get_total_unique_users_by_week(year)

                    
            processed_data = {}
            for row in weekly_data:
                month = row['month']
                week = row['week_of_month']
                menu_name = row['menu_nm']
                
                if (month, week) not in processed_data:
                    processed_data[(month, week)] = {
                        'month': month,
                        'week': week,
                        'menus': [],
                        'site_unique_user_count': site_unique_users.get((month, week), 0)
                    }
                
                processed_data[(month, week)]['menus'].append({
                    'menu_nm': menu_name,
                    'total_access_count': row['total_access_count'],
                    'unique_user_count': row['unique_user_count']
                })
            
                                    
            sorted_data = sorted(processed_data.values(), key=lambda x: (x['month'], x['week']))
            
                                    
            yearly_total = analytics_dao.get_yearly_total_stats(year, menu_nm)

            return jsonify({
                'weekly_stats': sorted_data,
                'yearly_chart_data': weekly_data,
                'yearly_total': yearly_total
            })

        elif view_type == 'comparison':
            if not year:
                return jsonify({'error': 'Year is required for comparison view'}), 400
            
                             
            this_year = int(year)
            last_year = this_year - 1

                    
            this_year_weekly_data = analytics_dao.get_menu_access_stats_weekly(str(this_year), menu_nm)
            this_year_site_unique = analytics_dao.get_total_unique_users_by_week(str(this_year))
            this_year_processed = process_weekly_data(this_year_weekly_data, this_year_site_unique)
            this_year_total = analytics_dao.get_yearly_total_stats(str(this_year), menu_nm)

                    
            last_year_weekly_data = analytics_dao.get_menu_access_stats_weekly(str(last_year), menu_nm)
            last_year_site_unique = analytics_dao.get_total_unique_users_by_week(str(last_year))
            last_year_processed = process_weekly_data(last_year_weekly_data, last_year_site_unique)
            last_year_total = analytics_dao.get_yearly_total_stats(str(last_year), menu_nm)

            return jsonify({
                'this_year_stats': this_year_processed,
                'last_year_stats': last_year_processed,
                'yearly_chart_data_this_year': this_year_weekly_data,
                'yearly_chart_data_last_year': last_year_weekly_data,
                'yearly_total': {
                    'this_year': this_year_total,
                    'last_year': last_year_total
                }
            })

        else:                             
            params = {
                'view_type': view_type,
                'start_date': start_date,
                'end_date': end_date,
                'year': year,
                'month': month
            }
            menu_stats = analytics_dao.get_menu_access_stats(**params)
            total_stats = analytics_dao.get_total_access_stats(**params)
            
            return jsonify({
                'menu_access_stats': menu_stats,
                'total_access_stats': total_stats
            })

    except Exception as e:
        logging.error(f"Error fetching statistics: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

def process_weekly_data(weekly_data, site_unique_users):
    """Helper function to process raw weekly data into a structured format."""
    processed_data = {}
    for row in weekly_data:
        month = row['month']
        week = row['week_of_month']
        menu_name = row['menu_nm']
        
        if (month, week) not in processed_data:
            processed_data[(month, week)] = {
                'month': month,
                'week': week,
                'menus': [],
                'site_unique_user_count': site_unique_users.get((month, week), 0)
            }
        
        processed_data[(month, week)]['menus'].append({
            'menu_nm': menu_name,
            'total_access_count': row['total_access_count'],
            'unique_user_count': row['unique_user_count']
        })
    
    return sorted(processed_data.values(), key=lambda x: (x['month'], x['week']))

                                                   
                 
                 
                                  
                                     
                                                  
                  
                                                                               

                 
          
                                    
                                            
                                                                                 

                                 
                                  
                        
                                           

                         
                                                       
                                                                                                
                                                                          
                                                                                                                               

                  
                                                         
                            
                            
                                     
                                     
                                           
                                  

                           
                       
                           
                                 
                                                                                
                                        
                                       
                                                                                               
                                    
        
                                                

                                                  
                                    
                                    
                                    
            
                                                   
                                      
                                    
                                              
                                                                                                       
                                                                                                   
                                                                                    
                                                                      
                                         
                                                        
                                                        

                                 
                                                                                         
                                                 
                                         
                                             
                                                                                                      

                            
                                
                            
                                           
                              
                      
                                                           
                                                           
                         
                          
                                               
                                                                 

                                   
                            
                         
                        

                           
                     
                                 
                                                      
                                                                                          
           

                            
                                                                           
                                                
              
                  
                          

@admin_bp.route('/api/statistics/monthly_excel_download')
@login_required
def download_monthly_statistics_excel():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if not start_date or not end_date:
        return jsonify({'error': 'start_date and end_date are required for Excel download'}), 400

    if 'mngr_sett' not in session.get('user', {}).get('permissions', []):
        return jsonify({'error': '권한이 없습니다.'}), 403
    conn = None
    try:
        conn = get_db_connection()
        analytics_dao = AnalyticsDAO(conn)
        monthly_data = analytics_dao.get_menu_access_stats_monthly(start_date, end_date)

        return jsonify(monthly_data)

    except Exception as e:
        logging.error(f"Error generating monthly Excel data: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

                                  
def get_excel_template_dir():
    """Get the Excel template directory path."""
    return os.path.join(current_app.static_folder, 'excel_templates')

def get_excel_template_path():
    """Get the Excel template file path."""
    return os.path.join(get_excel_template_dir(), 'excel_template.xlsx')

@admin_bp.route('/api/excel_template/upload', methods=['POST'])
@login_required
def upload_excel_template():
    """엑셀 템플릿 파일 업로드"""
    if 'mngr_sett' not in session.get('user', {}).get('permissions', []):
        return jsonify({'error': '권한이 없습니다.'}), 403

    if 'file' not in request.files:
        return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400

              
    allowed_extensions = {'xlsx', 'xls'}
    if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
        return jsonify({'error': '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'}), 400

                     
    if len(file.read()) > 10 * 1024 * 1024:
        return jsonify({'error': '파일 크기는 10MB를 초과할 수 없습니다.'}), 400
    file.seek(0)             

    try:
                 
        excel_template_dir = get_excel_template_dir()
        os.makedirs(excel_template_dir, exist_ok=True)

                               
        legacy_dir = os.path.join(excel_template_dir, 'legacy')
        os.makedirs(legacy_dir, exist_ok=True)

        import shutil
        from datetime import datetime

        for filename in os.listdir(excel_template_dir):
            if filename.endswith(('.xlsx', '.xls')) and filename != 'legacy':
                src_path = os.path.join(excel_template_dir, filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                legacy_filename = f"{timestamp}_{filename}"
                dst_path = os.path.join(legacy_dir, legacy_filename)
                shutil.move(src_path, dst_path)
                current_app.logger.info(f"Moved existing file {filename} to legacy: {legacy_filename}")

                          
        excel_template_path = os.path.join(excel_template_dir, file.filename)
        file.save(excel_template_path)

        return jsonify({
            'success': True,
            'message': '엑셀 템플릿이 성공적으로 업로드되었습니다.',
            'filename': file.filename
        })

    except Exception as e:
        logging.error(f"Error uploading Excel template: {e}", exc_info=True)
        return jsonify({'error': '파일 업로드 중 오류가 발생했습니다.'}), 500

                  
          
                   
                                                       
                                                        

                                   
                                                         
                                        

                          
                              
                                                   
                                               
            

                            
                                                                              
                                                                

@admin_bp.route('/api/excel_template/info', methods=['GET'])
@login_required
def get_excel_template_info():
    """엑셀 템플릿 파일 정보 조회"""
    if 'mngr_sett' not in session.get('user', {}).get('permissions', []):
        return jsonify({'error': '권한이 없습니다.'}), 403

    try:
        excel_template_dir = get_excel_template_dir()

                       
        excel_files = [f for f in os.listdir(excel_template_dir) if f.endswith(('.xlsx', '.xls')) and f != 'legacy']
        if not excel_files:
            return jsonify({
                'exists': False,
                'message': '업로드된 엑셀 템플릿이 없습니다.'
            })

                     
        filename = excel_files[0]
        excel_template_path = os.path.join(excel_template_dir, filename)

        stat = os.stat(excel_template_path)
        file_size = stat.st_size
        modified_time = datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({
            'exists': True,
            'filename': filename,
            'size': file_size,
            'modified': modified_time
        })

    except Exception as e:
        logging.error(f"Error getting Excel template info: {e}", exc_info=True)
        return jsonify({'error': '파일 정보 조회 중 오류가 발생했습니다.'}), 500

@admin_bp.route('/api/excel_template/download', methods=['GET'])
@login_required
def download_excel_template():
    """엑셀 템플릿 파일 다운로드"""

    try:
        excel_template_dir = get_excel_template_dir()

                       
        excel_files = [f for f in os.listdir(excel_template_dir) if f.endswith(('.xlsx', '.xls')) and f != 'legacy']
        if not excel_files:
            return jsonify({'error': '다운로드할 파일이 없습니다.'}), 404

                                
        filename = excel_files[0]                  
        excel_template_path = os.path.join(excel_template_dir, filename)

        current_app.logger.info(f"Excel template download - Found files: {excel_files}")
        current_app.logger.info(f"Excel template download - Selected file: {filename}")
        current_app.logger.info(f"Excel template download - File path: {excel_template_path}")
        current_app.logger.info(f"Excel template download - Download name: {filename}")

        response = send_file(
            excel_template_path,
            as_attachment=True,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

                                                 
        quoted_filename = quote(filename)
        ascii_filename = filename.encode('ascii', 'ignore').decode('ascii')
        response.headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{quoted_filename}; filename=\"{ascii_filename}\""
        current_app.logger.info(f"Excel template download - Original filename: {filename}")
        current_app.logger.info(f"Excel template download - Quoted filename: {quoted_filename}")
        current_app.logger.info(f"Excel template download - ASCII filename: {ascii_filename}")
        current_app.logger.info(f"Excel template download - Content-Disposition set to: {response.headers['Content-Disposition']}")

        return response

    except Exception as e:
        logging.error(f"Error downloading Excel template: {e}", exc_info=True)
        return jsonify({'error': '파일 다운로드 중 오류가 발생했습니다.'}), 500

                  
          
                                                         
                                                     
                                                               

                           
                                  
                                 
                                                  
                                                                                          
           

                            
                                                                                
                                                                 

@admin_bp.route('/api/excel_template/delete', methods=['DELETE'])
@login_required
def delete_excel_template():
    """엑셀 템플릿 파일 삭제"""
    if 'mngr_sett' not in session.get('user', {}).get('permissions', []):
        return jsonify({'error': '권한이 없습니다.'}), 403

    try:
        excel_template_dir = get_excel_template_dir()

                       
        excel_files = [f for f in os.listdir(excel_template_dir) if f.endswith(('.xlsx', '.xls')) and f != 'legacy']
        if not excel_files:
            return jsonify({'error': '삭제할 파일이 없습니다.'}), 404

                     
        filename = excel_files[0]
        excel_template_path = os.path.join(excel_template_dir, filename)

        os.remove(excel_template_path)

        return jsonify({
            'success': True,
            'message': '엑셀 템플릿이 성공적으로 삭제되었습니다.'
        })

    except Exception as e:
        logging.error(f"Error deleting Excel template: {e}", exc_info=True)
        return jsonify({'error': '파일 삭제 중 오류가 발생했습니다.'}), 500
