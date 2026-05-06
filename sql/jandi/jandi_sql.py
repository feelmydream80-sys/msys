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

                                         
                                      
    conditions.append("status = %s")
    params.append('CD901')

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

    return query, tuple(params)
