import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import pytz
from utils.datetime_utils import is_within_schedule_grace_period

@pytest.fixture
def app_context_fixture(app):
    """Flask 애플리케이션 컨텍스트를 제공하는 fixture"""
    with app.app_context():
        yield

def test_is_within_schedule_grace_period_within_grace(app_context_fixture):
    """시간이 grace period 내에 있는 경우 True를 반환하는지 테스트합니다."""
    kst = pytz.timezone('Asia/Seoul')

    # 예정 시간: 2023-01-01 10:00:00 KST
    schedule_dt = kst.localize(datetime(2023, 1, 1, 10, 0, 0))

    # 실제 시간: 2023-01-01 01:02:00 UTC (KST로는 10:02:00, 9시간 차이)
    history_dt = pytz.utc.localize(datetime(2023, 1, 1, 1, 2, 0))

    with patch('flask.current_app.logger') as mock_logger:
        result = is_within_schedule_grace_period(schedule_dt, history_dt, grace_minutes=5)

    assert result is True
    mock_logger.debug.assert_called_once()

def test_is_within_schedule_grace_period_outside_grace(app_context_fixture):
    """시간이 grace period를 벗어난 경우 False를 반환하는지 테스트합니다."""
    kst = pytz.timezone('Asia/Seoul')

    # 예정 시간: 2023-01-01 10:00:00 KST
    schedule_dt = kst.localize(datetime(2023, 1, 1, 10, 0, 0))

    # 실제 시간: 2023-01-01 10:10:00 UTC (KST로는 10:10:00, 10분 차이)
    history_dt = pytz.utc.localize(datetime(2023, 1, 1, 10, 10, 0))

    with patch('flask.current_app.logger') as mock_logger:
        result = is_within_schedule_grace_period(schedule_dt, history_dt, grace_minutes=5)

    assert result is False
    mock_logger.debug.assert_called_once()

def test_is_within_schedule_grace_period_no_history():
    """history_dt가 None인 경우 False를 반환하는지 테스트합니다."""
    kst = pytz.timezone('Asia/Seoul')
    schedule_dt = kst.localize(datetime(2023, 1, 1, 10, 0, 0))

    result = is_within_schedule_grace_period(schedule_dt, None, grace_minutes=5)

    assert result is False

def test_is_within_schedule_grace_period_naive_history(app_context_fixture):
    """history_dt가 timezone 정보가 없는 경우 UTC로 처리하는지 테스트합니다."""
    kst = pytz.timezone('Asia/Seoul')

    # 예정 시간: 2023-01-01 10:00:00 KST
    schedule_dt = kst.localize(datetime(2023, 1, 1, 10, 0, 0))

    # 실제 시간: timezone 정보 없는 datetime (UTC로 간주, KST로는 19:02:00)
    history_dt_naive = datetime(2023, 1, 1, 10, 2, 0)  # UTC 10:02:00 = KST 19:02:00

    with patch('flask.current_app.logger') as mock_logger:
        result = is_within_schedule_grace_period(schedule_dt, history_dt_naive, grace_minutes=600)  # 10시간

    assert result is True  # 9시간 2분 차이, 10시간 grace로 True
    mock_logger.debug.assert_called_once()

def test_is_within_schedule_grace_period_custom_grace(app_context_fixture):
    """커스텀 grace_minutes가 정상적으로 적용되는지 테스트합니다."""
    kst = pytz.timezone('Asia/Seoul')

    # 예정 시간: 2023-01-01 10:00:00 KST
    schedule_dt = kst.localize(datetime(2023, 1, 1, 10, 0, 0))

    # 실제 시간: 2023-01-01 01:15:00 UTC (KST로는 10:15:00)
    history_dt = pytz.utc.localize(datetime(2023, 1, 1, 1, 15, 0))

    # 20분 grace period에서는 True (15분 차이)
    with patch('flask.current_app.logger') as mock_logger:
        result = is_within_schedule_grace_period(schedule_dt, history_dt, grace_minutes=20)

    assert result is True

    # 10분 grace period에서는 False (15분 차이)
    with patch('flask.current_app.logger') as mock_logger:
        result = is_within_schedule_grace_period(schedule_dt, history_dt, grace_minutes=10)

    assert result is False
