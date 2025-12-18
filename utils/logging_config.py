import logging
import logging.handlers
import sys
import os
from flask import request
from config import config

def setup_logging(app, debug_mode=False):
    """
    애플리케이션 로깅을 설정합니다.

    Args:
        app: Flask 애플리케이션 인스턴스
        debug_mode: 디버그 모드 여부 (True: 콘솔 로깅, False: 파일 로깅)
    """
    log_level = logging.DEBUG if debug_mode else logging.INFO

    # IP 주소를 로그에 추가하기 위한 필터
    class RequestContextFilter(logging.Filter):
        def filter(self, record):
            record.remote_addr = request.remote_addr if request else 'N/A'
            return True

    app_log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(remote_addr)s - %(filename)s:%(lineno)d - %(message)s')
    root_logger = logging.getLogger()

    # 기존 핸들러 제거 (중복 출력 방지)
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    root_logger.setLevel(log_level)

    if not debug_mode:
        # --- 운영 모드: 파일 로깅 ---
        log_dir = config.LOG_DIR
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

        # 애플리케이션 로그 파일 핸들러
        app_file_handler = logging.handlers.TimedRotatingFileHandler(
            filename=os.path.join(log_dir, 'app.log'), when='midnight', backupCount=30, encoding='utf-8'
        )
        app_file_handler.setFormatter(app_log_formatter)
        app_file_handler.addFilter(RequestContextFilter())
        root_logger.addHandler(app_file_handler)

        # Werkzeug (Access) 로그 파일 핸들러
        werkzeug_logger = logging.getLogger('werkzeug')
        werkzeug_logger.setLevel(logging.INFO)
        werkzeug_log_formatter = logging.Formatter('%(asctime)s - %(message)s')
        werkzeug_file_handler = logging.handlers.TimedRotatingFileHandler(
            filename=os.path.join(log_dir, 'access.log'), when='midnight', backupCount=30, encoding='utf-8'
        )
        werkzeug_file_handler.setFormatter(werkzeug_log_formatter)
        werkzeug_logger.addHandler(werkzeug_file_handler)
        werkzeug_logger.propagate = False

        app.logger.info("로깅 시스템이 [파일 로깅]으로 초기화되었습니다. (운영 모드)")
    else:
        # --- 개발 모드: 콘솔 로깅 ---
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(app_log_formatter)
        console_handler.addFilter(RequestContextFilter())
        root_logger.addHandler(console_handler)

        # Werkzeug 로거도 콘솔에 출력하도록 설정
        werkzeug_logger = logging.getLogger('werkzeug')
        werkzeug_logger.setLevel(logging.INFO)
        werkzeug_logger.addHandler(console_handler)
        werkzeug_logger.propagate = False

        app.logger.info("로깅 시스템이 [콘솔 로깅]으로 초기화되었습니다. (개발 모드)")
