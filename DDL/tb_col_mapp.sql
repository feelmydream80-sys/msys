



CREATE TABLE IF NOT EXISTS public.tb_col_mapp
(
    mapp_id integer NOT NULL DEFAULT nextval('tb_column_mapping_mapp_id_seq'::regclass),
    bf_tbl_nm character varying(255) COLLATE pg_catalog."default",
    bf_col_nm character varying(255) COLLATE pg_catalog."default",
    new_tbl_nm character varying(255) COLLATE pg_catalog."default" NOT NULL,
    new_col_nm character varying(255) COLLATE pg_catalog."default" NOT NULL,
    expl text COLLATE pg_catalog."default",
    cre_dt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    upd_dt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tb_column_mapping_pkey PRIMARY KEY (mapp_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_col_mapp
    OWNER to etl_user;

COMMENT ON TABLE public.tb_col_mapp
    IS '시스템의 테이블 및 컬럼명 변경 이력을 관리하고, 레거시 코드와의 호환성을 유지하기 위한 매핑 정보를 저장하는 테이블';

COMMENT ON COLUMN public.tb_col_mapp.mapp_id
    IS '매핑 정보의 고유 식별자 (자동 증가)';

COMMENT ON COLUMN public.tb_col_mapp.bf_tbl_nm
    IS '변경 전 사용하던 레거시 테이블 이름';

COMMENT ON COLUMN public.tb_col_mapp.bf_col_nm
    IS '변경 전 사용하던 레거시 컬럼 이름';

COMMENT ON COLUMN public.tb_col_mapp.new_tbl_nm
    IS '회사 표준에 따라 변경된 새로운 테이블 이름';

COMMENT ON COLUMN public.tb_col_mapp.new_col_nm
    IS '회사 표준에 따라 변경된 새로운 컬럼 이름';

COMMENT ON COLUMN public.tb_col_mapp.expl
    IS '해당 매핑에 대한 관리자의 메모 또는 설명';

COMMENT ON COLUMN public.tb_col_mapp.cre_dt
    IS '매핑 정보가 처음 생성된 시각';

COMMENT ON COLUMN public.tb_col_mapp.upd_dt
    IS '매핑 정보가 마지막으로 수정된 시각';