
SELECT
    m.menu_id,
    m.menu_nm,
    m.menu_url,
    m.menu_order
FROM
    tb_menu m
JOIN
    tb_user_auth_ctrl a ON m.menu_id = a.menu_id
WHERE
    a.user_id = %s
ORDER BY
    m.menu_order ASC;
