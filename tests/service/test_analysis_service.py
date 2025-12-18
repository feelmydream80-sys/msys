import pytest
from unittest.mock import MagicMock, patch
from service.analysis_service import AnalysisService

@pytest.fixture
def analysis_service():
    """AnalysisService에 대한 테스트 fixture를 생성하고, 의존성을 모의 처리합니다."""
    with patch('service.analysis_service.AnalysisMapper') as MockAnalysisMapper:

        # DAO 모의 객체 설정
        mock_conn = MagicMock()

        service = AnalysisService(mock_conn)
        service.mapper = MockAnalysisMapper()
        yield service

def test_get_dynamic_chart_data_success(analysis_service):
    """get_dynamic_chart_data 메서드가 정상적으로 데이터를 반환하는지 테스트합니다."""
    params = {
        'x_axis': 'date',
        'y_axis': 'success_count',
        'start_date': '2023-01-01',
        'end_date': '2023-12-31'
    }
    user = {'user_id': 'admin', 'permissions': ['mngr_sett']}

    mock_data = [{'date': '2023-01-01', 'success_count': 10}]
    analysis_service.mapper.get_dynamic_chart_data.return_value = mock_data

    # 메서드 호출
    result = analysis_service.get_dynamic_chart_data(params, user)

    # 결과 검증
    assert result == mock_data
    analysis_service.mapper.get_dynamic_chart_data.assert_called_once_with(params)

def test_get_dynamic_chart_data_no_permissions(analysis_service):
    """get_dynamic_chart_data 메서드가 데이터 권한이 없는 사용자의 경우 빈 리스트를 반환하는지 테스트합니다."""
    params = {
        'x_axis': 'date',
        'y_axis': 'success_count',
        'start_date': '2023-01-01',
        'end_date': '2023-12-31'
    }
    user = {'user_id': 'user1', 'permissions': ['dashboard'], 'data_permissions': []}

    # 메서드 호출
    result = analysis_service.get_dynamic_chart_data(params, user)

    # 결과 검증
    assert result == []
    analysis_service.mapper.get_dynamic_chart_data.assert_not_called()

def test_get_dynamic_chart_data_filtered_permissions(analysis_service):
    """get_dynamic_chart_data 메서드가 데이터 권한에 따라 Job ID를 필터링하는지 테스트합니다."""
    params = {
        'x_axis': 'date',
        'y_axis': 'success_count',
        'start_date': '2023-01-01',
        'end_date': '2023-12-31',
        'job_ids': ['CD101', 'CD102', 'CD103']
    }
    user = {'user_id': 'user1', 'permissions': ['dashboard'], 'data_permissions': ['CD101', 'CD102']}

    mock_data = [{'date': '2023-01-01', 'success_count': 10}]
    analysis_service.mapper.get_dynamic_chart_data.return_value = mock_data

    # 메서드 호출
    result = analysis_service.get_dynamic_chart_data(params, user)

    # 결과 검증
    assert result == mock_data
    # job_ids가 필터링되어 호출되는지 확인
    analysis_service.mapper.get_dynamic_chart_data.assert_called_once()
    call_args = analysis_service.mapper.get_dynamic_chart_data.call_args[0][0]
    assert set(call_args['job_ids']) == {'CD101', 'CD102'}

def test_get_dynamic_chart_data_value_error(analysis_service):
    """get_dynamic_chart_data 메서드가 ValueError 발생 시 예외를 다시 발생시키는지 테스트합니다."""
    params = {
        'x_axis': 'invalid_axis',
        'y_axis': 'success_count',
        'start_date': '2023-01-01',
        'end_date': '2023-12-31'
    }
    user = {'user_id': 'admin', 'permissions': ['mngr_sett']}

    analysis_service.mapper.get_dynamic_chart_data.side_effect = ValueError("Invalid parameter")

    # 메서드 호출 및 예외 검증
    with pytest.raises(ValueError, match="Invalid parameter"):
        analysis_service.get_dynamic_chart_data(params, user)

def test_get_dynamic_chart_data_general_error(analysis_service):
    """get_dynamic_chart_data 메서드가 일반 예외 발생 시 예외를 다시 발생시키는지 테스트합니다."""
    params = {
        'x_axis': 'date',
        'y_axis': 'success_count',
        'start_date': '2023-01-01',
        'end_date': '2023-12-31'
    }
    user = {'user_id': 'admin', 'permissions': ['mngr_sett']}

    analysis_service.mapper.get_dynamic_chart_data.side_effect = Exception("DB Error")

    # 메서드 호출 및 예외 검증
    with pytest.raises(Exception, match="DB Error"):
        analysis_service.get_dynamic_chart_data(params, user)
