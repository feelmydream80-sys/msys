



CREATE TABLE IF NOT EXISTS public.tb_data_spec_parm
(
    parm_id integer NOT NULL DEFAULT nextval('tb_data_spec_params_id_seq'::regclass),
    api_spec_id integer NOT NULL,
    parm_tp character varying(50) COLLATE pg_catalog."default" NOT NULL,
    parm_nm_krn character varying(255) COLLATE pg_catalog."default",
    parm_nm_eng character varying(255) COLLATE pg_catalog."default",
    expl text COLLATE pg_catalog."default",
    ncsr_yn boolean DEFAULT false,
    CONSTRAINT tb_data_spec_params_pkey PRIMARY KEY (parm_id),
    CONSTRAINT fk_spec FOREIGN KEY (api_spec_id)
        REFERENCES public.tb_data_spec (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_data_spec_parm
    OWNER to etl_user;

COMMENT ON TABLE public.tb_data_spec_parm
    IS 'API 명세의 요청(Request) 및 응답(Response) 파라미터 정보를 저장하는 테이블';

COMMENT ON COLUMN public.tb_data_spec_parm.parm_id
    IS '고유 식별자';

COMMENT ON COLUMN public.tb_data_spec_parm.api_spec_id
    IS 'tb_data_spec 테이블의 외래 키';

COMMENT ON COLUMN public.tb_data_spec_parm.parm_tp
    IS '파라미터의 종류 (request 또는 response)';

COMMENT ON COLUMN public.tb_data_spec_parm.parm_nm_krn
    IS '파라미터 항목명 (국문)';

COMMENT ON COLUMN public.tb_data_spec_parm.parm_nm_eng
    IS '파라미터 항목명 (영문)';

COMMENT ON COLUMN public.tb_data_spec_parm.expl
    IS '파라미터에 대한 설명';

COMMENT ON COLUMN public.tb_data_spec_parm.ncsr_yn
    IS '필수 여부';