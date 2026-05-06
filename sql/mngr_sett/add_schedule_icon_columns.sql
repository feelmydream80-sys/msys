
ALTER TABLE tb_data_clt_schd_sett
ADD COLUMN grp_prgs_icon_id INT,
ADD COLUMN grp_sucs_icon_id INT;

COMMENT ON COLUMN tb_data_clt_schd_sett.grp_prgs_icon_id IS '그룹 진행률 아이콘 ID (tb_icon 참조)';
COMMENT ON COLUMN tb_data_clt_schd_sett.grp_sucs_icon_id IS '그룹 성공률 아이콘 ID (tb_icon 참조)';