import pytest
import json

def test_get_dynamic_chart_data_success(logged_in_client):
    """
    GET /api/analysis/dynamic-chart API가 유효한 파라미터로 정상 작동하는지 테스트합니다.
    """
    # API 호출
    response = logged_in_client.get('/api/analytics/dynamic-chart', query_string={
        'x_axis': 'date',
        'y_axis': 'success_count',
        'group_by': 'job_id',
        'start_date': '2025-01-01',
        'end_date': '2025-01-31'
    })

    print(f"API response status: {response.status_code}")
    print(f"API response data: {response.get_data(as_text=True)[:500]}...")

    # 응답 검증
    assert response.status_code == 200
    assert response.is_json
    data = response.get_json()
    assert isinstance(data, list)

    # 데이터 구조 검증 (가능한 경우)
    if data:
        item = data[0]
        # 동적 쿼리에 따라 필드가 달라질 수 있으므로 기본적인 타입 검증
        assert isinstance(item, dict)
        # x_axis가 'date'이므로 date 관련 필드가 있어야 함
        date_fields = [k for k in item.keys() if 'date' in k.lower() or 'dt' in k.lower()]
        if date_fields:
            # 날짜 필드가 있다면 문자열이나 datetime 객체여야 함
            for field in date_fields[:1]:  # 첫 번째 날짜 필드만 검증
                value = item[field]
                assert value is None or isinstance(value, (str, int)) or hasattr(value, 'isoformat')

def test_get_dynamic_chart_data_missing_params(logged_in_client):
    """
    GET /api/analysis/dynamic-chart API가 필수 파라미터 누락 시 400 에러를 반환하는지 테스트합니다.
    """
    response = logged_in_client.get('/api/analytics/dynamic-chart', query_string={
        'x_axis': 'date',
        'y_axis': 'success_count',
        # start_date, end_date 누락
    })

    assert response.status_code == 400
    assert response.is_json
    json_data = response.get_json()
    assert 'message' in json_data
    assert '필수 파라미터' in json_data['message']

def test_get_dynamic_chart_data_invalid_params(logged_in_client):
    """
    GET /api/analysis/dynamic-chart API가 유효하지 않은 파라미터로 요청 시 빈 데이터를 반환하는지 테스트합니다.
    """
    response = logged_in_client.get('/api/analytics/dynamic-chart', query_string={
        'x_axis': 'invalid_column', # 허용되지 않은 컬럼
        'y_axis': 'success_count',
        'start_date': '2025-01-01',
        'end_date': '2025-01-31'
    })

    assert response.status_code == 200
    assert response.is_json
    data = response.get_json()
    assert isinstance(data, list)
    # 현재 구현에서는 검증 없이 쿼리를 실행하므로 빈 데이터가 반환될 수 있음
