from msys.database import get_db_connection
from mapper.mst_mapper import MstMapper
from mapper.user_mapper import UserMapper
from datetime import datetime, timedelta
import croniter
import pytz
import re
from typing import Optional, Dict, List
from flask import current_app
from utils.datetime_utils import is_within_schedule_grace_period
from service.status_code_service import get_status_codes

class CollectionScheduleService:
    def __init__(self, conn):
        self.conn = conn

    def get_schedule_and_history(self, start_date, end_date, user: Optional[Dict] = None) -> List[Dict]:
        """
        주어진 기간 동안의 데이터 수집 스케줄과 실제 이력을 조합하여 반환합니다.
        사용자 권한에 따라 표시되는 Job이 필터링됩니다.
        """
        # 권한 확인 및 MST 데이터 가져오기
        allowed_job_ids = self._get_allowed_job_ids_for_schedule(user)
        if allowed_job_ids is not None and not allowed_job_ids:
            return []

        # 스케줄 생성
        scheduled_tasks = self._generate_scheduled_tasks(start_date, end_date, allowed_job_ids)

        # 히스토리 데이터 가져오기 및 그룹화
        history_by_date_job = self._fetch_and_group_history_data(start_date, end_date, allowed_job_ids, user)

        # 스케줄과 히스토리 매칭하여 상태 업데이트
        self._match_schedule_with_history(scheduled_tasks, history_by_date_job)

        # 매칭되지 않은 히스토리 처리
        self._process_unmatched_history(scheduled_tasks, history_by_date_job, allowed_job_ids)

        return scheduled_tasks

    def _get_allowed_job_ids_for_schedule(self, user: Optional[Dict]) -> Optional[List[str]]:
        """사용자 권한에 따라 허용된 Job ID 목록을 반환합니다."""
        if not user:
            return None

        is_admin = 'mngr_sett' in user.get('permissions', [])
        if is_admin:
            return None  # 모든 Job 허용

        allowed_job_ids = user.get('data_permissions', [])
        if not allowed_job_ids:
            return []
        return allowed_job_ids

    def _generate_scheduled_tasks(self, start_date, end_date, allowed_job_ids: Optional[List[str]]) -> List[Dict]:
        """MST 데이터로부터 스케줄된 작업들을 생성합니다."""
        mst_mapper = MstMapper(self.conn)
        kst = pytz.timezone('Asia/Seoul')
        now_kst = datetime.now(kst)

        all_mst_data = mst_mapper.get_all_mst_for_schedule(allowed_job_ids)
        jobs = {mst['cd']: mst.get('item6') for mst in all_mst_data if mst.get('item6')}

        scheduled_tasks = []
        current_date = start_date
        while current_date <= end_date:
            for cd, cron_str in jobs.items():
                if not cron_str or not re.match(r'^(\S+\s+){4,5}\S+$', cron_str.strip()):
                    continue

                try:
                    base_time = datetime(current_date.year, current_date.month, current_date.day)
                    cron = croniter.croniter(cron_str, base_time)
                    schedule_time = cron.get_next(datetime)
                    while schedule_time.date() == current_date:
                        schedule_time_aware = kst.localize(schedule_time)
                        status = "미수집"
                        if schedule_time_aware > now_kst:
                            status = "예정"

                        scheduled_tasks.append({
                            "date": schedule_time.strftime('%Y-%m-%d %H:%M:%S'),
                            "job_id": cd,
                            "cron": cron_str,
                            "status": status,
                        })
                        schedule_time = cron.get_next(datetime)
                except (ValueError, KeyError):
                    current_app.logger.warning(f"Skipping job '{cd}' due to invalid cron string: '{cron_str}'")
                    continue
                except Exception as e:
                    current_app.logger.error(f"Error parsing cron string '{cron_str}' for job '{cd}': {e}")
            current_date += timedelta(days=1)

        return scheduled_tasks

    def _fetch_and_group_history_data(self, start_date, end_date, allowed_job_ids: Optional[List[str]], user: Optional[Dict]) -> Dict[str, Dict[str, List[Dict]]]:
        """히스토리 데이터를 가져와서 날짜와 Job ID별로 그룹화합니다."""
        from service.dashboard_service import DashboardService
        dashboard_service = DashboardService(self.conn)
        kst = pytz.timezone('Asia/Seoul')

        history_data = dashboard_service.get_collection_history_for_schedule_with_start_dt(
            start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'), allowed_job_ids, user=user
        )

        history_by_date_job = {}
        for item in history_data:
            history_dt_utc = item.get('start_dt')
            if not history_dt_utc:
                continue

            if history_dt_utc.tzinfo is None:
                history_dt_utc = pytz.utc.localize(history_dt_utc)

            history_dt_kst = history_dt_utc.astimezone(kst)
            item['start_dt_kst'] = history_dt_kst
            date_str = history_dt_kst.strftime('%Y-%m-%d')
            job_id = item['job_id']

            if date_str not in history_by_date_job:
                history_by_date_job[date_str] = {}
            if job_id not in history_by_date_job[date_str]:
                history_by_date_job[date_str][job_id] = []
            history_by_date_job[date_str][job_id].append(item)

        return history_by_date_job

    def _match_schedule_with_history(self, scheduled_tasks: List[Dict], history_by_date_job: Dict[str, Dict[str, List[Dict]]]) -> None:
        """스케줄된 작업들과 히스토리 데이터를 매칭하여 상태를 업데이트합니다."""
        kst = pytz.timezone('Asia/Seoul')

        # Get all valid status codes dynamically
        status_codes = get_status_codes()
        valid_status_codes = list(status_codes.keys())

        for task in scheduled_tasks:
            if task['status'] == '예정':
                continue

            try:
                schedule_dt = datetime.strptime(task['date'], '%Y-%m-%d %H:%M:%S')
                schedule_dt = kst.localize(schedule_dt)
            except (ValueError, KeyError) as e:
                current_app.logger.error(f"Failed to parse schedule date for task {task.get('job_id', 'unknown')}: {e}")
                continue

            schedule_date_str = schedule_dt.strftime('%Y-%m-%d')
            job_id = task['job_id']

            if schedule_date_str in history_by_date_job and job_id in history_by_date_job[schedule_date_str]:
                history_for_job = history_by_date_job[schedule_date_str][job_id]
                history_for_job.sort(key=lambda x: x.get('start_dt_kst') or datetime.min.replace(tzinfo=kst))

                # 가장 먼저 발생한 기록을 찾아 매칭
                best_match = None
                for item in history_for_job:
                    status_code = item.get('status')
                    if status_code in valid_status_codes:
                        best_match = item
                        break

                if best_match:
                    self._update_task_status_from_history(task, best_match)
                    history_for_job.remove(best_match)

    def _update_task_status_from_history(self, task: Dict, history_item: Dict) -> None:
        """히스토리 항목으로부터 작업 상태를 업데이트합니다."""
        status_code = history_item.get('status')
        status_text = self._convert_status_code_to_text(status_code)
        task['status'] = status_text
        task['actual_date'] = history_item['start_dt_kst'].strftime('%Y-%m-%d %H:%M:%S')

    def _process_unmatched_history(self, scheduled_tasks: List[Dict], history_by_date_job: Dict[str, Dict[str, List[Dict]]], allowed_job_ids: Optional[List[str]]) -> None:
        """매칭되지 않은 히스토리 기록들을 처리합니다."""
        allowed_job_set = None if allowed_job_ids is None else set(allowed_job_ids)

        for date_str, jobs in history_by_date_job.items():
            for job_id, history_list in jobs.items():
                if allowed_job_set is not None and job_id not in allowed_job_set:
                    continue

                for item in history_list:
                    status_text = self._convert_status_code_to_text(item.get('status'))
                    kst_time = item['start_dt_kst']

                    scheduled_tasks.append({
                        "date": kst_time.strftime('%Y-%m-%d %H:%M:%S'),
                        "job_id": job_id,
                        "cron": "Unscheduled",
                        "status": status_text,
                        "actual_date": kst_time.strftime('%Y-%m-%d %H:%M:%S'),
                        "is_unscheduled": True
                    })

    def _convert_status_code_to_text(self, status_code: str) -> str:
        """상태 코드를 텍스트로 변환합니다."""
        if not status_code:
            return '알 수 없음'

        # Get status codes dynamically
        status_codes = get_status_codes()

        # Create mapping from codes to display text
        # For now, use the description from database, but we might need custom mapping
        # This could be extended to have a separate mapping table or configuration
        status_mapping = {}
        for code, desc in status_codes.items():
            if desc.upper() == 'SUCCESS':
                status_mapping[code] = '성공'
            elif desc.upper() == 'FAIL':
                status_mapping[code] = '실패'
            elif desc.upper() == 'NO_DATA':
                status_mapping[code] = '미수집'
            elif desc.upper() == 'IN_PROGRESS':
                status_mapping[code] = '수집중'
            else:
                # For unknown descriptions, use the description as-is or a default
                status_mapping[code] = desc

        return status_mapping.get(status_code, '알 수 없음')
