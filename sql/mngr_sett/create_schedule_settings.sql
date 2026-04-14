INSERT INTO tb_data_clt_schd_sett (
    grp_min_cnt, prgs_rt_red_thrsval, prgs_rt_org_thrsval, use_yn,
    grp_brdr_styl, grp_colr_crtr, succ_rt_red_thrsval, succ_rt_org_thrsval,
    memo_icon_id, memo_bg_colr, memo_txt_colr,
    regr_id, updr_id, upd_dt
) VALUES (
    %(grp_min_cnt)s, %(prgs_rt_red_thrsval)s, %(prgs_rt_org_thrsval)s, %(use_yn)s,
    %(grp_brdr_styl)s, %(grp_colr_crtr)s, %(succ_rt_red_thrsval)s, %(succ_rt_org_thrsval)s,
    %(memo_icon_id)s, %(memo_bg_colr)s, %(memo_txt_colr)s,
    %(regr_id)s, %(updr_id)s, CURRENT_TIMESTAMP
) RETURNING sett_id;