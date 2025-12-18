import pytest
import json
from msys.column_mapper import reload_mappings
from flask import g

def test_get_all_admin_settings(logged_in_client):
    """
    GET /api/mngr_sett/settings/all API가 정상적으로 모든 관리자 설정을 반환하는지 테스트합니다.
    """
    # API 호출
    response = logged_in_client.get('/api/mngr_sett/settings/all')

    # 응답 검증
    assert response.status_code == 200
    assert response.is_json

    data = response.get_json()
    assert isinstance(data, list) # 응답 데이터는 리스트 형태여야 합니다.

    # 데이터 구조 검증 (가능한 경우)
    if data:
        item = data[0]
        assert isinstance(item, dict), "각 설정 항목은 딕셔너리여야 합니다"

        # 일반적인 관리자 설정 필드 검증
        expected_fields = ['cd', 'cnn_failr_thrs_val', 'chrt_dsp_yn']
        for field in expected_fields:
            if field in item:
                # 필드가 존재하면 타입 검증
                if field == 'cd':
                    assert isinstance(item[field], str), f"{field}는 문자열이어야 합니다"
                elif field.endswith('_val') or field.endswith('_count'):
                    assert isinstance(item[field], (int, float, type(None))), f"{field}는 숫자이어야 합니다"
                elif field.endswith('_yn'):
                    assert item[field] in ['Y', 'N', None, True, False], f"{field}는 Y/N/None/True/False이어야 합니다"

def test_save_admin_settings(logged_in_client, db_conn, app_context):
    """
    POST /api/mngr_sett/settings/save API가 정상적으로 설정을 저장하는지 테스트합니다.
    """
    # --- 테스트 실행 ---
    try:
        # 테스트용 데이터 준비 (API가 기대하는 형식)
        test_data = {
            "mngr_settings": [
                {
                    "sett_id": "test_setting_01",
                    "CNN_FAILR_THRS_VAL": 99
                }
            ],
            "user_permissions": []
        }

        # API 호출
        response = logged_in_client.post('/api/mngr_sett/settings/save', json=test_data)

        # 응답 검증
        assert response.status_code == 200
        assert response.is_json
        json_data = response.get_json()
        assert json_data['message'] == "모든 설정이 성공적으로 저장되었습니다."

        # DB 데이터 검증 (표준 컬럼명 'cd'와 'cnn_failr_thrs_val'로 조회)
        with db_conn.cursor() as cursor:
            cursor.execute("SELECT cnn_failr_thrs_val FROM tb_mngr_sett WHERE cd = 'test_setting_01'")
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 99

    finally:
        # --- 테스트 환경 정리 ---
        # 테스트용으로 추가된 설정 데이터만 삭제합니다.
        with db_conn.cursor() as cursor:
            cursor.execute("DELETE FROM tb_mngr_sett WHERE cd = 'test_setting_01'")
        db_conn.commit()
