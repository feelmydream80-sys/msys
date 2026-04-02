from flask import Blueprint, request, jsonify
from service.api_key_mngr_service import ApiKeyMngrService
from ..auth_routes import login_required, check_password_change_required, api_key_mngr_required

api_key_mngr_api = Blueprint('api_key_mngr_api', __name__, url_prefix='/api')

@api_key_mngr_api.route('/api_key_mngr', methods=['GET'])
@login_required
@check_password_change_required
@api_key_mngr_required
def get_all_api_key_mngr():
    """모든 API 키 관리 정보 조회"""
    try:
        service = ApiKeyMngrService()
        data = service.get_all_api_key_mngr()
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/<cd>', methods=['GET'])
@login_required
@check_password_change_required
@api_key_mngr_required
def get_api_key_mngr_by_cd(cd):
    """CD로 API 키 관리 정보 조회"""
    try:
        service = ApiKeyMngrService()
        data = service.get_api_key_mngr_by_cd(cd)
        if data:
            return jsonify({
                'success': True,
                'data': data
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'API 키 관리 정보를 찾을 수 없습니다.'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr', methods=['POST'])
@login_required
@check_password_change_required
@api_key_mngr_required
def create_api_key_mngr():
    """API 키 관리 정보 생성"""
    try:
        data = request.json
        cd = data.get('cd')
        due = data.get('due', 1)
        start_dt = data.get('start_dt')
        api_ownr_email_addr = data.get('api_ownr_email_addr')
        
        if not cd:
            return jsonify({
                'success': False,
                'message': 'CD 값은 필수입니다.'
            }), 400
            
        service = ApiKeyMngrService()
        result = service.create_api_key_mngr(cd, due, start_dt, api_ownr_email_addr)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'API 키 관리 정보가 성공적으로 생성되었습니다.'
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'API 키 관리 정보 생성에 실패했습니다.'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/<cd>', methods=['PUT'])
@login_required
@check_password_change_required
@api_key_mngr_required
def update_api_key_mngr(cd):
    """API 키 관리 정보 업데이트 (TB_API_KEY_MNGR + TB_CON_MST ITEM10)"""
    try:
        data = request.json
        due = data.get('due')
        start_dt = data.get('start_dt')
        api_ownr_email_addr = data.get('api_ownr_email_addr')
        api_key = data.get('api_key')
        
        service = ApiKeyMngrService()
        result = service.update_api_key_mngr_with_api_key(cd, due, start_dt, api_ownr_email_addr, api_key)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'API 키 관리 정보가 성공적으로 업데이트되었습니다.'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'API 키 관리 정보 업데이트에 실패했습니다.'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/<cd>', methods=['DELETE'])
@login_required
@check_password_change_required
@api_key_mngr_required
def delete_api_key_mngr(cd):
    """API 키 관리 정보 삭제"""
    try:
        service = ApiKeyMngrService()
        result = service.delete_api_key_mngr(cd)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'API 키 관리 정보가 성공적으로 삭제되었습니다.'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'API 키 관리 정보 삭제에 실패했습니다.'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/update_cds', methods=['POST'])
@login_required
@check_password_change_required
@api_key_mngr_required
def update_cd_from_mngr_sett():
    """TB_MNGR_SETT에서 CD 값을 가져와 TB_API_KEY_MNGR에 없는 CD를 추가"""
    try:
        service = ApiKeyMngrService()
        added_count = service.update_cd_from_mngr_sett()
        
        return jsonify({
            'success': True,
            'message': f'TB_API_KEY_MNGR에 {added_count}개의 CD 값을 추가했습니다.',
            'added_count': added_count
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/send_email', methods=['POST'])
@login_required
@check_password_change_required
@api_key_mngr_required
def send_api_key_expiry_email():
    """선택된 API 키에 대해 만료 알림 메일 발송"""
    try:
        data = request.json
        cds = data.get('cds', [])
        
        if not cds:
            return jsonify({
                'success': False,
                'message': 'CD 목록이 필요합니다.'
            }), 400
        
        service = ApiKeyMngrService()
        results = service.send_expiry_notification(cds)
        
        # 결과 요약
        success_count = len(results['success'])
        failed_count = len(results['failed'])
        skipped_count = len(results['skipped'])
        
        message = f'메일 발송 완료: 성공 {success_count}건'
        if failed_count > 0:
            message += f', 실패 {failed_count}건'
        if skipped_count > 0:
            message += f', 건너뜀 {skipped_count}건'
        
        return jsonify({
            'success': True,
            'message': message,
            'results': results
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/mail_settings', methods=['GET'])
@login_required
@check_password_change_required
@api_key_mngr_required
def get_mail_settings():
    """메일 설정 조회"""
    try:
        service = ApiKeyMngrService()
        settings = service.get_mail_settings()
        return jsonify({
            'success': True,
            'settings': settings
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/mail_settings', methods=['POST'])
@login_required
@check_password_change_required
@api_key_mngr_required
def save_mail_settings():
    """메일 설정 저장"""
    try:
        data = request.json
        service = ApiKeyMngrService()
        result = service.save_mail_settings(data)
        
        if result:
            return jsonify({
                'success': True,
                'message': '메일 설정이 저장되었습니다.'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': '메일 설정 저장에 실패했습니다.'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_key_mngr_api.route('/api_key_mngr/event_log', methods=['GET'])
@login_required
@check_password_change_required
@api_key_mngr_required
def get_event_log():
    """이벤트 이력 조회"""
    try:
        service = ApiKeyMngrService()
        logs = service.get_event_logs()
        return jsonify({
            'success': True,
            'logs': logs
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

