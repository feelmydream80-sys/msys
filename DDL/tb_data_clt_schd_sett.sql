


DROP TABLE IF EXISTS tb_data_clt_schd_sett;


CREATE TABLE tb_data_clt_schd_sett (
    sett_id SERIAL PRIMARY KEY,
    grp_min_cnt INT NOT NULL,
    prgs_rt_red_thrsval INT NOT NULL,
    prgs_rt_org_thrsval INT NOT NULL,
    use_yn CHAR(1) NOT NULL DEFAULT 'Y',
    sucs_icon_id INT,
    sucs_bg_colr VARCHAR(10) NOT NULL DEFAULT '#dcfce7',
    sucs_txt_colr VARCHAR(10) NOT NULL DEFAULT '#166534',
    fail_icon_id INT,
    fail_bg_colr VARCHAR(10) NOT NULL DEFAULT '#fee2e2',
    fail_txt_colr VARCHAR(10) NOT NULL DEFAULT '#991b1b',
    prgs_icon_id INT,
    prgs_bg_colr VARCHAR(10) NOT NULL DEFAULT '#fef9c3',
    prgs_txt_colr VARCHAR(10) NOT NULL DEFAULT '#854d0e',
    nodt_icon_id INT,
    nodt_bg_colr VARCHAR(10) NOT NULL DEFAULT '#ffedd5',
    nodt_txt_colr VARCHAR(10) NOT NULL DEFAULT '#9a3412',
    schd_icon_id INT,
    schd_bg_colr VARCHAR(10) NOT NULL DEFAULT '#e5e7eb',
    schd_txt_colr VARCHAR(10) NOT NULL DEFAULT '#4b5563',
    regr_id VARCHAR(50),
    regr_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updr_id VARCHAR(50),
    updr_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


COMMENT ON TABLE tb_data_clt_schd_sett IS '데이터 수집 일정 표시 설정 테이블';
COMMENT ON COLUMN tb_data_clt_schd_sett.sett_id IS '설정 고유ID';
COMMENT ON COLUMN tb_data_clt_schd_sett.grp_min_cnt IS '그룹화 최소 개수';
COMMENT ON COLUMN tb_data_clt_schd_sett.prgs_rt_red_thrsval IS '진행률 문제점(붉은색) 임계값 (<)';
COMMENT ON COLUMN tb_data_clt_schd_sett.prgs_rt_org_thrsval IS '진행률 경고(주황색) 임계값 (<)';
COMMENT ON COLUMN tb_data_clt_schd_sett.use_yn IS '사용 여부';
COMMENT ON COLUMN tb_data_clt_schd_sett.sucs_icon_id IS '성공 아이콘 ID (tb_icon 참조)';
COMMENT ON COLUMN tb_data_clt_schd_sett.sucs_bg_colr IS '성공 배경색';
COMMENT ON COLUMN tb_data_clt_schd_sett.sucs_txt_colr IS '성공 글자색';
COMMENT ON COLUMN tb_data_clt_schd_sett.fail_icon_id IS '실패 아이콘 ID (tb_icon 참조)';
COMMENT ON COLUMN tb_data_clt_schd_sett.fail_bg_colr IS '실패 배경색';
COMMENT ON COLUMN tb_data_clt_schd_sett.fail_txt_colr IS '실패 글자색';
COMMENT ON COLUMN tb_data_clt_schd_sett.prgs_icon_id IS '수집중 아이콘 ID (tb_icon 참조)';
COMMENT ON COLUMN tb_data_clt_schd_sett.prgs_bg_colr IS '수집중 배경색';
COMMENT ON COLUMN tb_data_clt_schd_sett.prgs_txt_colr IS '수집중 글자색';
COMMENT ON COLUMN tb_data_clt_schd_sett.nodt_icon_id IS '미수집 아이콘 ID (tb_icon 참조)';
COMMENT ON COLUMN tb_data_clt_schd_sett.nodt_bg_colr IS '미수집 배경색';
COMMENT ON COLUMN tb_data_clt_schd_sett.nodt_txt_colr IS '미수집 글자색';
COMMENT ON COLUMN tb_data_clt_schd_sett.schd_icon_id IS '예정 아이콘 ID (tb_icon 참조)';
COMMENT ON COLUMN tb_data_clt_schd_sett.schd_bg_colr IS '예정 배경색';
COMMENT ON COLUMN tb_data_clt_schd_sett.schd_txt_colr IS '예정 글자색';
COMMENT ON COLUMN tb_data_clt_schd_sett.regr_id IS '등록자 ID';
COMMENT ON COLUMN tb_data_clt_schd_sett.regr_dt IS '등록 일시';
COMMENT ON COLUMN tb_data_clt_schd_sett.updr_id IS '수정자 ID';
COMMENT ON COLUMN tb_data_clt_schd_sett.updr_dt IS '수정 일시';





INSERT INTO tb_data_clt_schd_sett (
    grp_min_cnt, prgs_rt_red_thrsval, prgs_rt_org_thrsval, use_yn,
    sucs_icon_id, sucs_bg_colr, sucs_txt_colr,
    fail_icon_id, fail_bg_colr, fail_txt_colr,
    prgs_icon_id, prgs_bg_colr, prgs_txt_colr,
    nodt_icon_id, nodt_bg_colr, nodt_txt_colr,
    schd_icon_id, schd_bg_colr, schd_txt_colr,
    regr_id, updr_id
)
VALUES
(
    3, 30, 60, 'Y',
    NULL, '#dcfce7', '#166534',
    NULL, '#fee2e2', '#991b1b',
    NULL, '#fef9c3', '#854d0e',
    NULL, '#ffedd5', '#9a3412',
    NULL, '#e5e7eb', '#4b5563',
    'system', 'system'
);