
CREATE TABLE TB_COLUMN_MAPPING (
    mapp_id SERIAL PRIMARY KEY,
    bf_tbl_nm VARCHAR(255),
    bf_col_nm VARCHAR(255),
    new_tbl_nm VARCHAR(255) NOT NULL,
    new_col_nm VARCHAR(255) NOT NULL,
    expl TEXT,
    cre_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    upd_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE TB_COLUMN_MAPPING IS '시스템의 테이블 및 컬럼명 변경 이력을 관리하고, 레거시 코드와의 호환성을 유지하기 위한 매핑 정보를 저장하는 테이블';
COMMENT ON COLUMN TB_COLUMN_MAPPING.mapp_id IS '매핑 정보의 고유 식별자 (자동 증가)';
COMMENT ON COLUMN TB_COLUMN_MAPPING.bf_tbl_nm IS '변경 전 사용하던 레거시 테이블 이름';
COMMENT ON COLUMN TB_COLUMN_MAPPING.bf_col_nm IS '변경 전 사용하던 레거시 컬럼 이름';
COMMENT ON COLUMN TB_COLUMN_MAPPING.new_tbl_nm IS '회사 표준에 따라 변경된 새로운 테이블 이름';
COMMENT ON COLUMN TB_COLUMN_MAPPING.new_col_nm IS '회사 표준에 따라 변경된 새로운 컬럼 이름';
COMMENT ON COLUMN TB_COLUMN_MAPPING.expl IS '해당 매핑에 대한 관리자의 메모 또는 설명';
COMMENT ON COLUMN TB_COLUMN_MAPPING.cre_dt IS '매핑 정보가 처음 생성된 시각';
COMMENT ON COLUMN TB_COLUMN_MAPPING.upd_dt IS '매핑 정보가 마지막으로 수정된 시각';
