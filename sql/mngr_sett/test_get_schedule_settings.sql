
SELECT
    s.sett_id,
    s.grp_min_cnt,
    s.prgs_rt_red_thrsval,
    s.prgs_rt_org_thrsval,
    s.use_yn,
    s.grp_brdr_styl,
    s.grp_colr_crtr,
    s.succ_rt_red_thrsval,
    s.succ_rt_org_thrsval,
    s.sucs_icon_id,
    sucs_icon.icon_cd AS sucs_icon_cd,
    s.sucs_bg_colr,
    s.sucs_txt_colr,
    s.fail_icon_id,
    fail_icon.icon_cd AS fail_icon_cd,
    s.fail_bg_colr,
    s.fail_txt_colr,
    s.prgs_icon_id,
    prgs_icon.icon_cd AS prgs_icon_cd,
    s.prgs_bg_colr,
    s.prgs_txt_colr,
    s.nodt_icon_id,
    nodt_icon.icon_cd AS nodt_icon_cd,
    s.nodt_bg_colr,
    s.nodt_txt_colr,
    s.schd_icon_id,
    schd_icon.icon_cd AS schd_icon_cd,
    s.schd_bg_colr,
    s.schd_txt_colr
FROM
    tb_data_clt_schd_sett s
LEFT JOIN tb_icon sucs_icon ON s.sucs_icon_id = sucs_icon.icon_id
LEFT JOIN tb_icon fail_icon ON s.fail_icon_id = fail_icon.icon_id
LEFT JOIN tb_icon prgs_icon ON s.prgs_icon_id = prgs_icon.icon_id
LEFT JOIN tb_icon nodt_icon ON s.nodt_icon_id = nodt_icon.icon_id
LEFT JOIN tb_icon schd_icon ON s.schd_icon_id = schd_icon.icon_id
ORDER BY
    s.upd_dt DESC, s.sett_id DESC
LIMIT 1;