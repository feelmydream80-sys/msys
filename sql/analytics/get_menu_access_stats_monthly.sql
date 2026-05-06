
WITH DAILY_MENU_STATS AS (

    SELECT
        DATE_TRUNC('day', acs_dt) AS access_date,
        menu_nm,
        COUNT(user_id) AS daily_access_count,
        COUNT(DISTINCT user_id) AS daily_menu_unique_visitors
    FROM
        tb_user_acs_log
    WHERE
        acs_dt >= TO_TIMESTAMP(%(start_date)s, 'YYYY-MM-DD')
        AND acs_dt < TO_TIMESTAMP(%(end_date)s, 'YYYY-MM-DD') + INTERVAL '1 day'
    GROUP BY
        access_date,
        menu_nm
),
DAILY_SITE_STATS AS (

    SELECT
        DATE_TRUNC('day', acs_dt) AS access_date,
        COUNT(DISTINCT user_id) AS daily_site_unique_visitors
    FROM
        tb_user_acs_log
    WHERE
        acs_dt >= TO_TIMESTAMP(%(start_date)s, 'YYYY-MM-DD')
        AND acs_dt < TO_TIMESTAMP(%(end_date)s, 'YYYY-MM-DD') + INTERVAL '1 day'
    GROUP BY
        access_date
),
MONTHLY_SITE_STATS AS (

    SELECT
        TO_CHAR(access_date, 'YYYY-MM') AS month,
        SUM(daily_site_unique_visitors) AS site_unique_visitors
    FROM
        DAILY_SITE_STATS
    GROUP BY
        month
)

SELECT
    TO_CHAR(dms.access_date, 'YYYY-MM') AS month,
    dms.menu_nm,
    SUM(dms.daily_access_count) AS access_count,
    SUM(dms.daily_menu_unique_visitors) AS menu_unique_visitors,
    MAX(mss.site_unique_visitors) AS site_unique_visitors
FROM
    DAILY_MENU_STATS dms
JOIN
    MONTHLY_SITE_STATS mss ON TO_CHAR(dms.access_date, 'YYYY-MM') = mss.month
GROUP BY
    TO_CHAR(dms.access_date, 'YYYY-MM'),
    dms.menu_nm
ORDER BY
    month,
    dms.menu_nm;
