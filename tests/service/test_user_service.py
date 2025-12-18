import pytest
from unittest.mock import MagicMock, patch
from service.user_service import UserService

@pytest.fixture
def user_service():
    """UserService에 대한 테스트 fixture를 생성하고, 의존성을 모의 처리합니다."""
    with patch('service.user_service.UserMapper') as MockUserMapper, \
         patch('service.user_service.get_db_connection') as mock_get_db_connection:
        
        # DAO 모의 객체 설정
        mock_conn = MagicMock()
        mock_get_db_connection.return_value.__enter__.return_value = mock_conn
        
        service = UserService(mock_conn)
        service.user_mapper = MockUserMapper()
        yield service

def test_get_all_users_with_permissions(user_service):
    """get_all_users_with_permissions 메서드가 사용자 목록과 권한을 정상적으로 반환하는지 테스트합니다."""
    # 모의 데이터 설정
    mock_users = [{'user_id': 'testuser', 'name': 'Test User'}]
    mock_menus = [{'menu_id': 'dashboard', 'menu_name': 'Dashboard'}]
    mock_all_permissions = [{'user_id': 'testuser', 'menu_id': 'dashboard'}]
    
    user_service.user_mapper.find_all.return_value = mock_users
    user_service.user_mapper.find_all_menus.return_value = mock_menus
    user_service.user_mapper.find_all_permissions.return_value = mock_all_permissions

    # 메서드 호출
    result = user_service.get_all_users_with_permissions()

    # 결과 검증
    assert 'users' in result
    assert 'menus' in result
    assert len(result['users']) == 1
    assert result['users'][0]['permissions'] == ['dashboard']
    user_service.user_mapper.find_all.assert_called_once()
    user_service.user_mapper.find_all_menus.assert_called_once()
    user_service.user_mapper.find_all_permissions.assert_called_once()

def test_approve_user(user_service, app_context):
    """approve_user 메서드가 사용자를 승인하는지 테스트합니다."""
    user_id = 'testuser'

    with patch('service.user_service.g') as mock_g:
        mock_g.user = {'user_id': 'admin'}

        # 메서드 호출
        user_service.approve_user(user_id)

        # 결과 검증
        user_service.user_mapper.update_status.assert_called_once_with(user_id, 'APPROVED')
        # 비밀번호 업데이트는 더 이상 수행되지 않음

def test_reject_user(user_service, app_context):
    """reject_user 메서드가 사용자를 거절하고 삭제하는지 테스트합니다."""
    user_id = 'testuser'
    with patch('service.user_service.g') as mock_g:
        mock_g.user = {'user_id': 'admin'}
        
        # 메서드 호출
        user_service.reject_user(user_id)

        # 결과 검증
        user_service.user_mapper.delete_by_id.assert_called_once_with(user_id)

def test_delete_user(user_service, app_context):
    """delete_user 메서드가 사용자를 삭제하는지 테스트합니다."""
    user_id = 'testuser'
    with patch('service.user_service.g') as mock_g:
        mock_g.user = {'user_id': 'admin'}

        # 메서드 호출
        user_service.delete_user(user_id)

        # 결과 검증
        user_service.user_mapper.delete_by_id.assert_called_once_with(user_id)

def test_reset_password(user_service, app_context):
    """reset_password 메서드가 비밀번호를 초기화하는지 테스트합니다."""
    user_id = 'testuser'
    with patch('service.user_service.PasswordService.hash_password') as mock_hash_password, \
         patch('service.user_service.g') as mock_g:
        mock_hash_password.return_value = 'hashed_password'
        mock_g.user = {'user_id': 'admin'}

        # 메서드 호출
        user_service.reset_password(user_id)

        # 결과 검증
        user_service.user_mapper.update_password.assert_called_once_with(user_id, 'hashed_password')
        mock_hash_password.assert_called_once_with(user_id)

def test_update_permissions(user_service):
    """update_permissions 메서드가 사용자 권한을 업데이트하는지 테스트합니다."""
    user_id = 'testuser'
    menu_ids = ['dashboard', 'admin']

    # 메서드 호출
    user_service.update_permissions(user_id, menu_ids)

    # 결과 검증
    user_service.user_mapper.update_user_permissions.assert_called_once_with(user_id, menu_ids)
