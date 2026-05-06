from dao.sql_loader import load_sql

class AnalyticsSQL:
    @staticmethod
    def get_available_years_months():
        return load_sql('analytics/get_available_years_months.sql')

    @staticmethod
    def get_cumulative_success_rate_trend():
        return load_sql('analytics/get_cumulative_success_rate_trend.sql')

    @staticmethod
    def get_success_rate_trend():
        return load_sql('analytics/get_success_rate_trend.sql')

    @staticmethod
    def get_total_access_stats():
        return load_sql('analytics/get_total_access_stats.sql')

    @staticmethod
    def get_trouble_by_code():
        return load_sql('analytics/get_trouble_by_code.sql')

    @staticmethod
    def get_user_access_stats():
        return load_sql('analytics/get_user_access_stats.sql')

    @staticmethod
    def insert_user_access_log():
        return load_sql('analytics/insert_user_access_log.sql')

    @staticmethod
    def build_dynamic_query(params: dict):
                                               
                                                                 
        query = "SELECT * FROM TB_CON_HIST"
        query_params = []
        conditions = []

        if params.get('start_date'):
            conditions.append("start_dt >= %s")
            query_params.append(params['start_date'])
        if params.get('end_date'):
            conditions.append("start_dt <= %s")
            query_params.append(params['end_date'])
        if params.get('job_ids'):
            conditions.append("job_id = ANY(%s)")
            query_params.append(params['job_ids'])

        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        return query, query_params
