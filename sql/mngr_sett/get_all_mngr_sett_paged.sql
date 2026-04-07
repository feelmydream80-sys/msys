SELECT
    tas.CD,
    tas.CNN_FAILR_THRS_VAL,
    tas.CNN_WARN_THRS_VAL,
    tas.CNN_FAILR_ICON_ID,
    tas.CNN_FAILR_WRD_COLR,
    tas.CNN_WARN_ICON_ID,
    tas.CNN_WARN_WRD_COLR,
    tas.CNN_SUCS_ICON_ID,
    tas.CNN_SUCS_WRD_COLR,
    tas.DLY_SUCS_RT_THRS_VAL,
    tas.DD7_SUCS_RT_THRS_VAL,
    tas.MTHL_SUCS_RT_THRS_VAL,
    tas.MC6_SUCS_RT_THRS_VAL,
    tas.YY1_SUCS_RT_THRS_VAL,
    tas.SUCS_RT_SUCS_ICON_ID,
    tas.SUCS_RT_SUCS_WRD_COLR,
    tas.SUCS_RT_WARN_ICON_ID,
    tas.SUCS_RT_WARN_WRD_COLR,
    tas.CHRT_COLR,
    tas.CHRT_DSP_YN,
    tas.GRASS_CHRT_MIN_COLR,
    tas.GRASS_CHRT_MAX_COLR,
    tcm.cd_nm,
    tcm.cd_desc,
    tcm.item5,
    icf.ICON_CD AS cf_fail_icon_code,
    icw.ICON_CD AS cf_warning_icon_code,
    icsu.ICON_CD AS cf_success_icon_code,
    icsr.ICON_CD AS sr_success_icon_code,
    icws.ICON_CD AS sr_warning_icon_code
FROM TB_MNGR_SETT tas
LEFT JOIN tb_con_mst tcm ON tas.CD = tcm.cd
LEFT JOIN TB_ICON icf ON tas.CNN_FAILR_ICON_ID = icf.ICON_ID
LEFT JOIN TB_ICON icw ON tas.CNN_WARN_ICON_ID = icw.ICON_ID
LEFT JOIN TB_ICON icsu ON tas.CNN_SUCS_ICON_ID = icsu.ICON_ID
LEFT JOIN TB_ICON icsr ON tas.SUCS_RT_SUCS_ICON_ID = icsr.ICON_ID
LEFT JOIN TB_ICON icws ON tas.SUCS_RT_WARN_ICON_ID = icws.ICON_ID
WHERE (%s::text IS NULL OR tas.CD ILIKE '%%' || %s || '%%' OR tcm.cd_nm ILIKE '%%' || %s || '%%')
ORDER BY tas.CD
LIMIT %s OFFSET %s