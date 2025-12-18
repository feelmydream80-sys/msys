-- 연간 주별 메뉴 접속 통계를 위한 일별 데이터 조회
SELECT
    ACS_DT::date AS access_date,
    MENU_NM,
    COUNT(*) AS total_access_count,
    COUNT(DISTINCT USER_ID) AS unique_user_count
FROM
    TB_USER_ACS_LOG
WHERE
    EXTRACT(YEAR FROM ACS_DT) = %s
GROUP BY access_date, MENU_NM
ORDER BY access_date, MENU_NM
