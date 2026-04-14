--tb_data_clt_schd_sett 테이블의 미사용 컬럼을 메모 표시 색상으로 용도 변경
ALTER TABLE tb_data_clt_schd_sett
    RENAME COLUMN prgs_icon_id TO memo_icon_id,
    RENAME COLUMN prgs_bg_colr TO memo_bg_colr,
    RENAME COLUMN prgs_txt_colr TO memo_txt_colr;

COMMENT ON COLUMN tb_data_clt_schd_sett.memo_icon_id IS '메모 아이콘 ID (tb_icon 참조)';
COMMENT ON COLUMN tb_data_clt_schd_sett.memo_bg_colr IS '메모 배경색';
COMMENT ON COLUMN tb_data_clt_schd_sett.memo_txt_colr IS '메모 텍스트색';