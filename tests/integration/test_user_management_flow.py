import pytest
from unittest.mock import patch

def test_user_registration_and_approval_flow(client, db_conn):
    """
    사용자 등록부터 승인까지의 전체 흐름을 테스트합니다.
    통합 테스트: API 호출, 데이터베이스 상태 변경, 권한 적용
    """
    import time
    test_user_id = f'testuser_{int(time.time())}'  # 고유한 사용자 ID 생성

    # 1. 사용자 등록
    response = client.post('/register', data={
        'user_id': test_user_id,
        'password': 'password123',
        'password_confirm': 'password123'
    }, follow_redirects=True)

    assert response.status_code == 200

    # 2. 데이터베이스에서 PENDING 상태 확인
    with db_conn.cursor() as cursor:
        cursor.execute("SELECT acc_sts FROM tb_user WHERE user_id = %s", (test_user_id,))
        result = cursor.fetchone()
        assert result is not None
        assert result[0] == 'PENDING'

    # 3. 관리자 로그인 (통합을 위해 실제 로그인 사용)
    login_response = client.post('/login', data={
        'user_id': 'admin',
        'password': 'admin'
    }, follow_redirects=True)
    assert login_response.status_code == 200

    # 4. 사용자 승인 (관리자 권한으로) - 실제 API 호출로 변경
    response = client.post('/api/mngr_sett/users/approve', json={'user_id': test_user_id})
    assert response.status_code == 200

    # 5. 데이터베이스에서 APPROVED 상태 확인
    with db_conn.cursor() as cursor:
        cursor.execute("SELECT acc_sts FROM tb_user WHERE user_id = %s", (test_user_id,))
        result = cursor.fetchone()
        assert result is not None
        assert result[0] == 'APPROVED'

    # 6. 정리: 테스트 데이터 삭제
    with db_conn.cursor() as cursor:
        cursor.execute("DELETE FROM tb_user WHERE user_id = %s", (test_user_id,))
    db_conn.commit()

def test_dashboard_data_flow(client, db_conn):
    """
    대시보드 데이터 조회 흐름을 테스트합니다.
    통합 테스트: 로그인 → 데이터 조회 → 권한 필터링
    """
    # 1. 일반 사용자 로그인
    login_response = client.post('/login', data={
        'user_id': 'admin',
        'password': 'admin'
    }, follow_redirects=True)
    assert login_response.status_code == 200

    # 2. 대시보드 데이터 조회 (필수 파라미터 포함)
    response = client.get('/api/dashboard/summary', query_string={
        'start_date': '2023-01-01',
        'end_date': '2023-12-31',
        'all_data': 'true'
    })
    assert response.status_code == 200
    assert response.is_json

    data = response.get_json()
    assert isinstance(data, list)

    # 3. 각 항목에 필요한 필드가 있는지 확인 및 데이터 타입 검증
    if data:
        item = data[0]
        required_fields = ['job_id', 'cd_nm', 'total_count']
        for field in required_fields:
            assert field in item, f"필수 필드 '{field}'가 응답에 없습니다"

        # 데이터 타입 검증
        assert isinstance(item['job_id'], str), "job_id는 문자열이어야 합니다"
        assert isinstance(item.get('total_count', 0), int), "total_count는 정수여야 합니다"
        assert item.get('total_count', 0) >= 0, "total_count는 0 이상이어야 합니다"

        # 선택 필드 검증 (있는 경우)
        if 'day_success' in item:
            assert isinstance(item['day_success'], int), "day_success는 정수여야 합니다"
        if 'fail_streak' in item:
            assert isinstance(item['fail_streak'], int), "fail_streak는 정수여야 합니다"
            assert item['fail_streak'] >= 0, "fail_streak는 0 이상이어야 합니다"

def test_analysis_data_retrieval_flow(client):
    """
    분석 데이터 조회 흐름을 테스트합니다.
    통합 테스트: 로그인 → 분석 데이터 조회 → 필터링 적용
    """
    # 1. 로그인
    login_response = client.post('/login', data={
        'user_id': 'admin',
        'password': 'admin'
    }, follow_redirects=True)
    assert login_response.status_code == 200

    # 2. 분석 데이터 조회
    response = client.get('/api/analytics/summary', query_string={
        'start_date': '2023-01-01',
        'end_date': '2023-12-31'
    })
    assert response.status_code == 200
    assert response.is_json

    data = response.get_json()
    assert isinstance(data, list)

def test_admin_settings_management_flow(client, db_conn):
    """
    관리자 설정 관리 흐름을 테스트합니다.
    통합 테스트: 로그인 → 설정 조회 → 설정 저장 → 변경 확인
    """
    # 1. 관리자 로그인
    login_response = client.post('/login', data={
        'user_id': 'admin',
        'password': 'admin'
    }, follow_redirects=True)
    assert login_response.status_code == 200

    # 2. 설정 조회
    response = client.get('/api/mngr_sett/settings/all')
    assert response.status_code == 200
    assert response.is_json

    settings = response.get_json()
    assert isinstance(settings, list)

    # 3. 설정 저장 (테스트용 데이터)
    test_settings = {
        "mngr_settings": [{
            "sett_id": "test_integration_001",
            "CNN_FAILR_THRS_VAL": 50
        }],
        "user_permissions": []
    }

    response = client.post('/api/mngr_sett/settings/save', json=test_settings)
    assert response.status_code == 200

    # 4. 데이터베이스에서 변경 확인
    with db_conn.cursor() as cursor:
        cursor.execute("SELECT cnn_failr_thrs_val FROM tb_mngr_sett WHERE cd = 'test_integration_001'")
        result = cursor.fetchone()
        assert result is not None
        assert result[0] == 50

    # 5. 정리
    with db_conn.cursor() as cursor:
        cursor.execute("DELETE FROM tb_mngr_sett WHERE cd = 'test_integration_001'")
    db_conn.commit()
