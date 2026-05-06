

SELECT
    A.USER_ID,
    A.USER_ID AS USER_NM,
    A.ACC_STS AS USER_STAT,
    COALESCE((
        SELECT
            '[' || STRING_AGG('"' || B.JOB_ID || '"', ',') || ']'
        FROM
            TB_USER_DATA_PERM_AUTH_CTRL B
        WHERE
            B.USER_ID = A.USER_ID
    ), '[]') AS JOB_IDS
FROM
    TB_USER A

ORDER BY
    A.USER_ID;