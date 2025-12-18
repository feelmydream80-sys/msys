import pytest
from unittest.mock import MagicMock, patch
from service.dashboard_service import DashboardService

@pytest.fixture
def dashboard_service():
    """DashboardService에 대한 테스트 fixture를 생성하고, 의존성을 모의 처리합니다."""
    with patch('service.dashboard_service.DashboardMapper') as MockDashboardMapper, \
         patch('service.dashboard_service.UserMapper') as MockUserMapper, \
         patch('service.dashboard_service.MngrSettMapper') as MockMngrSettMapper, \
         patch('service.dashboard_service.get_db_connection') as mock_get_db_connection:

        # DAO 모의 객체 설정
        mock_conn = MagicMock()
        mock_get_db_connection.return_value.__enter__.return_value = mock_conn

        service = DashboardService(mock_conn)
        service.dashboard_mapper = MockDashboardMapper()
        service.user_mapper = MockUserMapper()
        service.mngr_sett_mapper = MockMngrSettMapper()
        yield service

def test_get_min_max_dates(dashboard_service):
    """get_min_max_dates 메서드가 정상적으로 최소/최대 날짜를 반환하는지 테스트합니다."""
    # 모의 데이터 설정
    mock_dates = {'min_date': '2023-01-01', 'max_date': '2023-12-31'}
    dashboard_service.dashboard_mapper.get_min_max_dates.return_value = mock_dates

    # 메서드 호출
    result = dashboard_service.get_min_max_dates()

    # 결과 검증
    assert result == mock_dates
    dashboard_service.dashboard_mapper.get_min_max_dates.assert_called_once()

def test_calculate_fail_streak(dashboard_service):
    """_calculate_fail_streak 메서드가 연속 실패 횟수를 정상적으로 계산하는지 테스트합니다."""
    job_id = 'CD101'
    expected_fail_count = 3

    # 모의 커서 설정
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = (expected_fail_count,)
    dashboard_service.connection.cursor.return_value.__enter__.return_value = mock_cursor

    # 메서드 호출
    result = dashboard_service._calculate_fail_streak(job_id)

    # 결과 검증
    assert result == expected_fail_count
    mock_cursor.execute.assert_called_once()
    # 쿼리 파라미터 검증
    args, kwargs = mock_cursor.execute.call_args
    assert job_id in args[1]

def test_calculate_fail_streak_error(dashboard_service):
    """_calculate_fail_streak 메서드가 오류 발생 시 0을 반환하는지 테스트합니다."""
    job_id = 'CD101'

    # 모의 커서가 예외를 발생시키도록 설정
    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = Exception("DB Error")
    dashboard_service.connection.cursor.return_value.__enter__.return_value = mock_cursor

    # 메서드 호출
    result = dashboard_service._calculate_fail_streak(job_id)

    # 결과 검증
    assert result == 0

def test_get_distinct_job_ids_admin(dashboard_service):
    """get_distinct_job_ids 메서드가 관리자 사용자의 경우 모든 Job ID를 반환하는지 테스트합니다."""
    user = {'permissions': ['mngr_sett']}
    mock_job_ids = ['CD101', 'CD102', 'CD103']
    dashboard_service.dashboard_mapper.get_distinct_job_ids.return_value = mock_job_ids

    # 메서드 호출
    result = dashboard_service.get_distinct_job_ids(user)

    # 결과 검증
    assert result == mock_job_ids
    dashboard_service.dashboard_mapper.get_distinct_job_ids.assert_called_once_with(job_ids=None)

def test_get_distinct_job_ids_non_admin(dashboard_service):
    """get_distinct_job_ids 메서드가 일반 사용자의 경우 허용된 Job ID만 반환하는지 테스트합니다."""
    user = {'permissions': ['dashboard'], 'data_permissions': ['CD101', 'CD102']}
    mock_job_ids = ['CD101', 'CD102']
    dashboard_service.dashboard_mapper.get_distinct_job_ids.return_value = mock_job_ids

    # 메서드 호출
    result = dashboard_service.get_distinct_job_ids(user)

    # 결과 검증
    assert result == mock_job_ids
    dashboard_service.dashboard_mapper.get_distinct_job_ids.assert_called_once()
    # 호출된 인자 확인 (순서 무관)
    call_args = dashboard_service.dashboard_mapper.get_distinct_job_ids.call_args
    assert 'job_ids' in call_args.kwargs
    assert set(call_args.kwargs['job_ids']) == {'CD101', 'CD102'}

def test_get_distinct_job_ids_no_permissions(dashboard_service):
    """get_distinct_job_ids 메서드가 데이터 권한이 없는 사용자의 경우 빈 리스트를 반환하는지 테스트합니다."""
    user = {'permissions': ['dashboard'], 'data_permissions': []}

    # 메서드 호출
    result = dashboard_service.get_distinct_job_ids(user)

    # 결과 검증
    assert result == []
    dashboard_service.dashboard_mapper.get_distinct_job_ids.assert_not_called()

def test_save_event(dashboard_service):
    """save_event 메서드가 이벤트를 정상적으로 저장하는지 테스트합니다."""
    con_id = '123'
    job_id = 'CD101'
    status = 'SUCCESS'
    rqs_info = 'Test event'

    # 메서드 호출
    dashboard_service.save_event(con_id, job_id, status, rqs_info)

    # 결과 검증
    dashboard_service.dashboard_mapper.save_event.assert_called_once_with(con_id, job_id, status, rqs_info)
