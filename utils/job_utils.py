"""
Job 유틸리티 모듈
Job ID 관련 공통 기능 제공
"""
import re


def should_exclude_job(job_id):
    """
    100단위 및 CD900~CD999 제외 여부 확인
    - CD100, CD200, CD300, CD400 등 100단위 제외
    - CD900~CD999 범위 제외
    
    Args:
        job_id: Job ID 문자열 (예: 'CD400')
        
    Returns:
        bool: 제외해야 하면 True, 아니면 False
    """
    if not job_id:
        return True
    
    job_id = str(job_id).upper().strip()
    
              
    match = re.match(r'CD(\d+)', job_id)
    if match:
        cd_number = int(match.group(1))
                                 
        return (900 <= cd_number <= 999) or (cd_number % 100 == 0)
    
    return False


def validate_job_id_format(job_id):
    """
    Job ID 형식 및 범위 검증
    - CD1 ~ CD9999 (4자리 이하)만 허용
    - 5자리(10만 단위) 이상은 오류 반환
    
    Args:
        job_id: Job ID 문자열 (예: 'CD1001')
        
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not job_id:
        return False, "Job ID가 필요합니다."
    
    job_id = str(job_id).upper().strip()
    
              
    match = re.match(r'CD(\d+)', job_id)
    if not match:
        return False, "Job ID는 'CD'로 시작하고 숫자가 따라와야 합니다."
    
    cd_number = int(match.group(1))
    
                       
    if cd_number >= 10000:
        return False, "그룹 코드는 CD1 ~ CD9999까지만 입력 가능합니다. (4자리 이하)"
    
    return True, None
