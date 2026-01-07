"""
Status Code Service
Handles loading and caching status codes from database instead of hardcoding.
"""
import logging
from typing import Dict, List, Optional
from service.mst_service import ConMstService

class StatusCodeService:
    """Service for managing status codes dynamically from database."""

    _instance = None
    _status_codes = {}
    _status_descriptions = {}

    def __new__(cls, db_connection=None):
        if cls._instance is None:
            cls._instance = super(StatusCodeService, cls).__new__(cls)
        return cls._instance

    def __init__(self, db_connection=None):
        if not hasattr(self, '_initialized'):
            self._initialized = True
            self.db_connection = db_connection
            self.mst_service = ConMstService(db_connection) if db_connection else None
            self._load_status_codes()

    def _load_status_codes(self):
        """Load status codes from database and cache them."""
        try:
            if not self.mst_service:
                logging.warning("MST service not available, using default status codes")
                self._set_default_codes()
                return

            codes = self.mst_service.get_error_code_map()
            if not codes:
                logging.warning("No status codes found in database, using defaults")
                self._set_default_codes()
                return

            self._status_codes = {}
            self._status_descriptions = {}

            for code_info in codes:
                code = code_info.get('cd')
                description = code_info.get('item1')  # 영문 설명

                if code and description:
                    self._status_codes[code] = description
                    self._status_descriptions[description] = code

            logging.info(f"Loaded {len(self._status_codes)} status codes from database")

        except Exception as e:
            logging.error(f"Failed to load status codes from database: {e}")
            self._set_default_codes()

    def _set_default_codes(self):
        """Set default status codes when database is not available."""
        self._status_codes = {
            'CD901': 'SUCCESS',
            'CD902': 'FAIL',
            'CD903': 'NO_DATA',
            'CD904': 'IN_PROGRESS',
            'CD905': 'NO_DATA_ALT'
        }
        self._status_descriptions = {v: k for k, v in self._status_codes.items()}

    def get_status_codes(self) -> Dict[str, str]:
        """Get all status codes with their descriptions."""
        return self._status_codes.copy()

    def get_status_description(self, code: str) -> Optional[str]:
        """Get description for a specific status code."""
        return self._status_codes.get(code)

    def get_status_code(self, description: str) -> Optional[str]:
        """Get status code for a specific description."""
        return self._status_descriptions.get(description)

    def get_success_codes(self) -> List[str]:
        """Get codes that represent success states."""
        # 성공 관련 코드들 (설명이 SUCCESS인 것들)
        return [code for code, desc in self._status_codes.items() if 'SUCCESS' in desc.upper()]

    def get_fail_codes(self) -> List[str]:
        """Get codes that represent failure states."""
        # 실패 관련 코드들
        return [code for code, desc in self._status_codes.items() if 'FAIL' in desc.upper()]

    def get_in_progress_codes(self) -> List[str]:
        """Get codes that represent in-progress states."""
        # 진행중 관련 코드들
        return [code for code, desc in self._status_codes.items() if 'PROGRESS' in desc.upper() or 'ING' in desc.upper()]

    def get_no_data_codes(self) -> List[str]:
        """Get codes that represent no-data states."""
        # 미수집 관련 코드들
        return [code for code, desc in self._status_codes.items() if 'NO_DATA' in desc.upper() or 'DATA' in desc.upper()]

    def reload_codes(self):
        """Reload status codes from database."""
        self._load_status_codes()

# Global instance
status_code_service = None

def init_status_codes(db_connection):
    """Initialize global status code service."""
    global status_code_service
    status_code_service = StatusCodeService(db_connection)
    return status_code_service

def get_status_codes():
    """Get global status codes."""
    if status_code_service is None:
        raise RuntimeError("Status code service not initialized")
    return status_code_service.get_status_codes()

def get_status_description(code: str):
    """Get status description from global service."""
    if status_code_service is None:
        raise RuntimeError("Status code service not initialized")
    return status_code_service.get_status_description(code)
