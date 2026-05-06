



CREATE TABLE IF NOT EXISTS public.tb_con_trbl_hist
(
    trbl_hist_no integer NOT NULL DEFAULT nextval('trbl_hist_seq'::regclass),
    trbl_cd character varying(20) COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default",
    frst_reg_dt timestamp with time zone,
    lst_chg_dt timestamp with time zone,
    retry_cnt integer,
    CONSTRAINT "xpk연계_장애_이력_정보" PRIMARY KEY (trbl_hist_no)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_con_trbl_hist
    OWNER to airflow_user;