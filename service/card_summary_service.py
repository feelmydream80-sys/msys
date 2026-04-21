# service/card_summary_service.py
from collections import defaultdict
from service.dashboard_service import DashboardService
from service.collection_schedule_service import CollectionScheduleService
from service.status_code_service import status_code_service
from datetime import datetime, date
import pytz

class CardSummaryService:
    def __init__(self, db_connection):
        self.db_connection = db_connection
        self.dashboard_service = DashboardService(db_connection)
        self.collection_schedule_service = CollectionScheduleService(db_connection)

    def _get_schedule_settings(self):
        """
        관리자 설정에서 스케줄 표시 설정을 조회합니다.
        grp_colr_crtr, 임계값 등을 포함합니다.
        """
        try:
            from service.mngr_sett_service import MngrSettService
            mngr_service = MngrSettService(self.db_connection)
            settings = mngr_service.get_schedule_settings_service()
            
            if settings:
                return {
                    'grp_colr_crtr': settings.get('grpColrCrtr', 'succ'),  # 'succ' (성공률) 또는 'prgr' (진행률)
                    'prgs_rt_red_thrsval': float(settings.get('prgsRtRedThrsval', 30) or 30),
                    'prgs_rt_org_thrsval': float(settings.get('prgsRtOrgThrsval', 60) or 60),
                    'succ_rt_red_thrsval': float(settings.get('succRtRedThrsval', 30) or 30),
                    'succ_rt_org_thrsval': float(settings.get('succRtOrgThrsval', 60) or 60),
                }
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to load schedule settings: {e}")
        
        # 기본값 반환
        return {
            'grp_colr_crtr': 'succ',
            'prgs_rt_red_thrsval': 30,
            'prgs_rt_org_thrsval': 60,
            'succ_rt_red_thrsval': 30,
            'succ_rt_org_thrsval': 60,
        }

    def _apply_opacity(self, hex_color, opacity=0.5):
        """
        HEX 색상에 투명도를 적용합니다.
        
        Args:
            hex_color: HEX 색상 코드 (예: '#dcfce7')
            opacity: 투명도 (0.0 ~ 1.0), 기본값 0.5 (50%)
        
        Returns:
            str: RGBA 형식의 색상 (예: 'rgba(220, 252, 231, 0.5)')
        """
        # HEX에서 RGB 추출
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            r = int(hex_color[0] + hex_color[0], 16)
            g = int(hex_color[1] + hex_color[1], 16)
            b = int(hex_color[2] + hex_color[2], 16)
        else:
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
        
        return f"rgba({r}, {g}, {b}, {opacity})"

    def _calculate_group_color(self, group_stats, settings, status_info_map):
        """
        그룹의 성공률/진행률에 따라 CD901(성공)과 CD902(실패) 색상을 
        투명도 50%로 적용하여 반환합니다.
        
        Returns:
            dict: {'bg_colr': str, 'txt_colr': str}
        """
        total = group_stats.get('total', 0)
        success = group_stats.get('success', 0)
        fail = group_stats.get('fail', 0)
        in_progress = group_stats.get('in_progress', 0)
        completed = success + fail
        
        # CD901(성공)과 CD902(실패) 색상 가져오기
        cd901_info = status_info_map.get('CD901', {'bg_colr': '#dcfce7', 'txt_colr': '#166534'})
        cd902_info = status_info_map.get('CD902', {'bg_colr': '#fee2e2', 'txt_colr': '#991b1b'})
        # 주황색 (중간 상태)
        orange_bg = '#fef3c7'
        orange_txt = '#92400e'
        
        if total == 0:
            return {'bg_colr': 'rgba(107, 114, 128, 0.5)', 'txt_colr': '#ffffff'}  # 기본 회색 50% 투명
        
        # 성공률 계산
        success_rate = (success / completed * 100) if completed > 0 else 0
        # 진행률 계산
        progress_rate = (completed / total * 100) if total > 0 else 0
        
        # 설정에 따른 기준값 선택
        criteria = settings.get('grp_colr_crtr', 'succ')
        
        if criteria == 'succ':
            # 성공률 기준
            red_threshold = settings.get('succ_rt_red_thrsval', 30)
            orange_threshold = settings.get('succ_rt_org_thrsval', 60)
            value = success_rate
        else:
            # 진행률 기준
            red_threshold = settings.get('prgs_rt_red_thrsval', 30)
            orange_threshold = settings.get('prgs_rt_org_thrsval', 60)
            value = progress_rate
        
        # CD901(성공)과 CD902(실패) 색상 적용 (투명도 50%)
        if value < red_threshold:
            # 빨강 (CD902 색상 - 실패)
            return {
                'bg_colr': self._apply_opacity(cd902_info['bg_colr'], 0.5), 
                'txt_colr': cd902_info['txt_colr']
            }
        elif value < orange_threshold:
            # 주황 (중간)
            return {
                'bg_colr': self._apply_opacity(orange_bg, 0.5), 
                'txt_colr': orange_txt
            }
        else:
            # 초록 (CD901 색상 - 성공)
            return {
                'bg_colr': self._apply_opacity(cd901_info['bg_colr'], 0.5), 
                'txt_colr': cd901_info['txt_colr']
            }

    def get_card_summary(self, user):
        """
        Gets the latest job status for today and formats it for the card summary view.
        """
        kst = pytz.timezone('Asia/Seoul')
        today = datetime.now(kst).date()

        # 1. Get today's scheduled tasks
        job_statuses_today = self.collection_schedule_service.get_schedule_only(today, today, user)
        
        # 2. 권한 체크를 위한 허용된 Job IDs 준비
        allowed_job_ids = None
        if user:
            is_admin = 'mngr_sett' in user.get('permissions', [])
            if not is_admin:
                allowed_job_ids = set(user.get('data_permissions', []))
        
        # 3. 관리자 설정 조회 (그룹 색상 기준)
        schedule_settings = self._get_schedule_settings()
        
        # 4. TB_STS_CD_MST에서 상태 코드 정보 조회
        status_info_map = {}
        if status_code_service:
            try:
                all_status = status_code_service.get_status_codes()
                for cd_code, name in all_status.items():
                    status_info_map[cd_code] = {
                        'name': name,
                        'bg_colr': '#808080',
                        'txt_colr': '#ffffff'
                    }
            except:
                pass
        
        # 기본 상태 코드 정보
        default_status_info = {
            'CD901': {'name': '성공', 'bg_colr': '#dcfce7', 'txt_colr': '#166534'},
            'CD902': {'name': '실패', 'bg_colr': '#fee2e2', 'txt_colr': '#991b1b'},
            'CD903': {'name': '미수집', 'bg_colr': '#fef3c7', 'txt_colr': '#92400e'},
            'CD904': {'name': '수집중', 'bg_colr': '#dbeafe', 'txt_colr': '#1e40af'},
            'CD907': {'name': '예정', 'bg_colr': '#f3f4f6', 'txt_colr': '#4b5563'},
            'CD908': {'name': '미수집', 'bg_colr': '#fef3c7', 'txt_colr': '#92400e'}
        }
        
        for cd_code, info in default_status_info.items():
            if cd_code not in status_info_map:
                status_info_map[cd_code] = info
        
        # 5. 그룹별로 데이터 수집 (CD100, CD200 등)
        # 구조: {그룹: {상태코드: {count, jobs}}}
        group_data = defaultdict(lambda: defaultdict(lambda: {"count": 0, "jobs": []}))
        
        # 그룹 통계 저장 (색상 계산용)
        group_stats = defaultdict(lambda: {'total': 0, 'success': 0, 'fail': 0, 'in_progress': 0})
        
        for job in job_statuses_today:
            job_id = job['job_id']
            status = job['status']
            
            # 권한 체크
            if allowed_job_ids is not None and job_id not in allowed_job_ids:
                continue
            
            if job_id and job_id.startswith('CD'):
                # 그룹 결정 (CD100, CD1000 등) - 100단위 그룹화
                numeric_part = job_id[2:]
                if len(numeric_part) >= 4:
                    # CD10xx -> CD1000 (4자리 이상)
                    group = f"CD{numeric_part[:2]}00"
                elif len(numeric_part) >= 3:
                    # CD1xx -> CD100 (3자리)
                    group = f"CD{numeric_part[0]}00"
                else:
                    # CDxx -> CDxx00 (1~2자리)
                    group = f"CD{numeric_part}00"
                
                # 시간 추출
                schedule_time_str = job.get('date', '')
                hour = ''
                try:
                    schedule_dt = datetime.strptime(schedule_time_str, '%Y-%m-%d %H:%M:%S')
                    hour = f"({schedule_dt.hour}시)"
                except ValueError:
                    pass
                
                formatted_job = f"{job_id}{hour}"
                
                # 상태 코드 결정
                target_cd = status if status and status in status_info_map else 'CD907'
                
                group_data[group][target_cd]['count'] += 1
                group_data[group][target_cd]['jobs'].append(formatted_job)
                
                # 그룹 통계 업데이트
                group_stats[group]['total'] += 1
                if status == 'CD901':
                    group_stats[group]['success'] += 1
                elif status == 'CD902':
                    group_stats[group]['fail'] += 1
                elif status in ['CD904']:
                    group_stats[group]['in_progress'] += 1
        
        # 6. 그룹별로 응답 구성 (데이터 존재하는 것만)
        summary_data = {}
        
        for group, statuses in group_data.items():
            group_total = 0
            group_statuses = {}
            
            for cd_code, data in statuses.items():
                if data['count'] > 0:  # 데이터 있는 것만
                    info = status_info_map.get(cd_code, {
                        'name': cd_code,
                        'bg_colr': '#808080',
                        'txt_colr': '#ffffff'
                    })
                    
                    group_statuses[cd_code] = {
                        'name': info['name'],
                        'count': data['count'],
                        'jobs': sorted(data['jobs'], key=lambda x: int(x.split('(')[0][2:])),
                        'bg_colr': info['bg_colr'],
                        'txt_colr': info['txt_colr']
                    }
                    group_total += data['count']
            
            if group_statuses:  # 상태 데이터가 있는 그룹만 포함
                # 그룹 색상 계산 (CD901, CD902 색상 사용)
                stats = group_stats[group]
                group_colors = self._calculate_group_color(stats, schedule_settings, status_info_map)
                
                summary_data[group] = {
                    'total': group_total,
                    'statuses': group_statuses,
                    'group_bg_colr': group_colors['bg_colr'],
                    'group_txt_colr': group_colors['txt_colr'],
                    'success_rate': round((stats['success'] / (stats['success'] + stats['fail']) * 100), 1) if (stats['success'] + stats['fail']) > 0 else 0,
                    'progress_rate': round((stats['success'] + stats['fail']) / stats['total'] * 100, 1) if stats['total'] > 0 else 0
                }
        
        return summary_data
