from dao.sql_loader import load_sql
from service.status_code_service import get_status_codes

class DashboardSQL:
    @staticmethod
    def get_event_log():
        return load_sql('dashboard/get_event_log.sql')

    @staticmethod
    def get_event_log_min_max_dates():
        return load_sql('dashboard/get_event_log_min_max_dates.sql')

    @staticmethod
    def get_min_max_dates():
        return load_sql('dashboard/get_min_max_dates.sql')

    @staticmethod
    def insert_event_log():
        return load_sql('dashboard/insert_event_log.sql')

    @staticmethod
    def get_dashboard_summary(start_date, end_date, all_data, job_ids=None):
        # Get status codes dynamically
        status_codes = get_status_codes()

        # Ensure we have at least basic status codes as fallback
        if not status_codes:
            status_codes = {
                'CD901': 'SUCCESS',
                'CD902': 'FAIL',
                'CD903': 'NO_DATA'
            }

        # Create dynamic CASE WHEN clauses for each status code
        def create_count_case(status_code, period_condition=""):
            condition = f"h.status = '{status_code}'"
            if period_condition:
                condition += f" AND {period_condition}"
            return f"COUNT(CASE WHEN {condition} THEN 1 END)"

        kst_date_expr = "(h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date"

        # Helper function to create safe column names
        def safe_column_name(prefix, desc):
            # Replace spaces and special characters with underscores, keep only alphanumeric and underscore
            safe_desc = ''.join(c if c.isalnum() or c == '_' else '_' for c in desc.lower().replace(' ', '_'))
            # Ensure it's not empty
            if not safe_desc:
                safe_desc = 'unknown'
            return f"{prefix}_{safe_desc}"

        # Define fixed column mappings based on status codes
        column_mappings = {
            'CD901': 'success',
            'CD902': 'fail',
            'CD903': 'no_data',
            'CD904': 'ing'
        }

        # Overall counts - use fixed column names
        overall_counts = []
        for code, col_suffix in column_mappings.items():
            if code in status_codes:
                col_name = f"overall_{col_suffix}_count"
                overall_counts.append(f"{create_count_case(code)} as {col_name}")

        # Daily counts
        daily_counts = []
        for code, col_suffix in column_mappings.items():
            if code in status_codes:
                col_name = f"day_{col_suffix}"
                if col_suffix == 'fail':
                    col_name = f"day_{col_suffix}_count"
                elif col_suffix == 'no_data':
                    col_name = f"day_{col_suffix}_count"
                period_condition = f"{kst_date_expr} = CURRENT_DATE"
                daily_counts.append(f"{create_count_case(code, period_condition)} as {col_name}")

        # Weekly counts
        weekly_counts = []
        for code, col_suffix in column_mappings.items():
            if code in status_codes:
                col_name = f"week_{col_suffix}"
                if col_suffix == 'fail':
                    col_name = f"week_{col_suffix}_count"
                elif col_suffix == 'no_data':
                    col_name = f"week_{col_suffix}_count"
                period_condition = f"{kst_date_expr} >= date_trunc('week', CURRENT_DATE)"
                weekly_counts.append(f"{create_count_case(code, period_condition)} as {col_name}")

        # Monthly counts
        monthly_counts = []
        for code, col_suffix in column_mappings.items():
            if code in status_codes:
                col_name = f"month_{col_suffix}"
                if col_suffix == 'fail':
                    col_name = f"month_{col_suffix}_count"
                elif col_suffix == 'no_data':
                    col_name = f"month_{col_suffix}_count"
                period_condition = f"{kst_date_expr} >= date_trunc('month', CURRENT_DATE)"
                monthly_counts.append(f"{create_count_case(code, period_condition)} as {col_name}")

        # Half-year counts
        half_counts = []
        for code, col_suffix in column_mappings.items():
            if code in status_codes:
                col_name = f"half_{col_suffix}"
                if col_suffix == 'fail':
                    col_name = f"half_{col_suffix}_count"
                elif col_suffix == 'no_data':
                    col_name = f"half_{col_suffix}_count"
                period_condition = f"{kst_date_expr} >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'"
                half_counts.append(f"{create_count_case(code, period_condition)} as {col_name}")

        # Yearly counts
        yearly_counts = []
        for code, col_suffix in column_mappings.items():
            if code in status_codes:
                col_name = f"year_{col_suffix}"
                if col_suffix == 'fail':
                    col_name = f"year_{col_suffix}_count"
                elif col_suffix == 'no_data':
                    col_name = f"year_{col_suffix}_count"
                period_condition = f"{kst_date_expr} >= date_trunc('year', CURRENT_DATE)"
                yearly_counts.append(f"{create_count_case(code, period_condition)} as {col_name}")

        # Get fail codes for fail_streak calculation
        from service.status_code_service import status_code_service
        fail_codes = status_code_service.get_fail_codes() if status_code_service else ['CD902', 'CD903']
        fail_codes_str = "', '".join(fail_codes)
        fail_condition = f"recent_runs.status IN ('{fail_codes_str}')"

        # Ensure we have at least some columns
        if not overall_counts:
            overall_counts = ["COUNT(CASE WHEN h.status = 'CD901' THEN 1 END) as overall_success_count"]
        if not daily_counts:
            daily_counts = ["COUNT(CASE WHEN h.status = 'CD901' AND (h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date = CURRENT_DATE THEN 1 END) as day_success"]
        if not weekly_counts:
            weekly_counts = ["COUNT(CASE WHEN h.status = 'CD901' AND (h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date >= date_trunc('week', CURRENT_DATE) THEN 1 END) as week_success"]
        if not monthly_counts:
            monthly_counts = ["COUNT(CASE WHEN h.status = 'CD901' AND (h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date >= date_trunc('month', CURRENT_DATE) THEN 1 END) as month_success"]
        if not half_counts:
            half_counts = ["COUNT(CASE WHEN h.status = 'CD901' AND (h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months' THEN 1 END) as half_success"]
        if not yearly_counts:
            yearly_counts = ["COUNT(CASE WHEN h.status = 'CD901' AND (h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date >= date_trunc('year', CURRENT_DATE) THEN 1 END) as year_success"]

        query = f"""
            SELECT
                h.job_id,
                m.cd_nm,
                m.item6 as frequency,
                MIN(h.start_dt) AS min_con_dt,
                MAX(h.start_dt) AS max_con_dt,
                COUNT(*) as total_count,
                -- Overall counts
                {', '.join(overall_counts)},

                -- Daily counts (today in KST)
                {', '.join(daily_counts)},

                -- Weekly counts (this week in KST)
                {', '.join(weekly_counts)},

                -- Monthly counts (this month in KST)
                {', '.join(monthly_counts)},

                -- Half-year counts (last 6 months in KST)
                {', '.join(half_counts)},

                -- Yearly counts (this year in KST)
                {', '.join(yearly_counts)},

                -- 연속 실패 계산 (최근 10번 실행 중 실패 횟수)
                COALESCE((
                    SELECT COUNT(*)
                    FROM (
                        SELECT status
                        FROM TB_CON_HIST h2
                        WHERE h2.job_id = h.job_id
                        ORDER BY h2.start_dt DESC
                        LIMIT 10
                    ) recent_runs
                    WHERE {fail_condition}
                ), 0) as fail_streak
            FROM
                TB_CON_HIST h
            LEFT JOIN
                TB_CON_MST m ON h.job_id = m.cd
        """
        params = []
        conditions = []

        # Ensure job_id is not NULL to prevent invalid groups
        conditions.append("h.job_id IS NOT NULL")

        if not all_data:
            if start_date:
                conditions.append(f"{kst_date_expr} >= %s")
                params.append(start_date)
            if end_date:
                conditions.append(f"{kst_date_expr} <= %s")
                params.append(end_date)

        if job_ids:
            conditions.append("h.job_id = ANY(%s)")
            params.append(job_ids)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " GROUP BY h.job_id, m.cd_nm, m.item6 ORDER BY h.job_id ASC"
            
        return query, params

    @staticmethod
    def get_daily_job_counts(job_id, start_date, end_date, all_data, job_ids=None):
        kst_date_expr = "(start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date"
        query = f"""
            SELECT
                {kst_date_expr} as date,
                COUNT(*) as count
            FROM
                TB_CON_HIST
        """
        params = []
        conditions = []

        if job_id:
            conditions.append("job_id = %s")
            params.append(job_id)

        if job_ids:
            conditions.append("job_id = ANY(%s)")
            params.append(job_ids)

        if not all_data:
            if start_date:
                conditions.append(f"{kst_date_expr} >= %s")
                params.append(start_date)
            if end_date:
                conditions.append(f"{kst_date_expr} <= %s")
                params.append(end_date)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += f" GROUP BY {kst_date_expr} ORDER BY {kst_date_expr}"

        return query, params

    @staticmethod
    def get_collection_history_for_schedule(start_date, end_date, job_ids=None):
        kst_date_expr = "(h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date"
        query = f"""
            SELECT
                h.job_id,
                TO_CHAR(h.start_dt AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as start_dt,
                h.status
            FROM
                TB_CON_HIST h
        """
        conditions = [f"{kst_date_expr} BETWEEN %s AND %s"]
        params = [start_date, end_date]

        if job_ids:
            conditions.append("h.job_id = ANY(%s)")
            params.append(job_ids)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        return query, params

    @staticmethod
    def get_collection_history_for_schedule_with_start_dt(start_date, end_date, job_ids=None):
        kst_date_expr = "(h.start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date"
        query = f"""
            SELECT
                h.job_id,
                {kst_date_expr} as collection_date,
                h.status,
                TO_CHAR(h.start_dt AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as start_dt
            FROM
                TB_CON_HIST h
        """
        conditions = [f"{kst_date_expr} BETWEEN %s AND %s"]
        params = [start_date, end_date]

        if job_ids:
            conditions.append("h.job_id = ANY(%s)")
            params.append(job_ids)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        return query, params
        
    @staticmethod
    def get_distinct_error_codes(start_date=None, end_date=None, all_data=False, job_ids=None):
        # Get success codes to exclude from error codes
        from service.status_code_service import status_code_service
        success_codes = status_code_service.get_success_codes() if status_code_service else ['CD901']

        query = "SELECT DISTINCT status FROM TB_CON_HIST"
        params = []
        conditions = ["status IS NOT NULL"]

        # Exclude success codes
        if success_codes:
            exclude_conditions = [f"status <> '{code}'" for code in success_codes]
            conditions.extend(exclude_conditions)

        # KST 기준 날짜로 변환하여 비교 (다른 메서드들과 일관성 유지)
        kst_date_expr = "(start_dt::timestamp AT TIME ZONE 'Asia/Seoul')::date"

        if not all_data:
            if start_date:
                conditions.append(f"{kst_date_expr} >= %s")
                params.append(start_date)
            if end_date:
                conditions.append(f"{kst_date_expr} <= %s")
                params.append(end_date)

        if job_ids:
            conditions.append("job_id = ANY(%s)")
            params.append(job_ids)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY status"

        return query, params

    @staticmethod
    def get_distinct_job_ids(job_ids=None):
        query = "SELECT DISTINCT job_id FROM tb_con_hist WHERE job_id IS NOT NULL"
        params = []
        
        if job_ids:
            query += " AND job_id = ANY(%s)"
            params.append(job_ids)
            
        query += " ORDER BY job_id"
        
        return query, params
