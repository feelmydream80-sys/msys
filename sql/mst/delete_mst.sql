UPDATE tb_con_mst SET use_yn = 'N', del_dt = CURRENT_TIMESTAMP, update_dt = CURRENT_TIMESTAMP WHERE cd_cl = %s AND cd = %s;
