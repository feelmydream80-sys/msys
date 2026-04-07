SELECT COUNT(*) as total
FROM TB_MNGR_SETT tas
LEFT JOIN tb_con_mst tcm ON tas.CD = tcm.cd
WHERE (%s::text IS NULL OR tas.CD ILIKE '%%' || %s || '%%' OR tcm.cd_nm ILIKE '%%' || %s || '%%')