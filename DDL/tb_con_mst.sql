



CREATE TABLE IF NOT EXISTS public.tb_con_mst
(
    cd_cl character varying(20) COLLATE pg_catalog."default" NOT NULL,
    cd character varying(20) COLLATE pg_catalog."default" NOT NULL,
    cd_nm character varying(20) COLLATE pg_catalog."default",
    cd_desc character varying(50) COLLATE pg_catalog."default",
    item1 character varying(50) COLLATE pg_catalog."default",
    item2 character varying(50) COLLATE pg_catalog."default",
    item3 character varying(150) COLLATE pg_catalog."default",
    item4 character varying(50) COLLATE pg_catalog."default",
    item5 character varying(50) COLLATE pg_catalog."default",
    item6 character varying(50) COLLATE pg_catalog."default",
    item7 character varying(50) COLLATE pg_catalog."default",
    item8 character varying(50) COLLATE pg_catalog."default",
    item9 character varying(400) COLLATE pg_catalog."default",
    item10 character varying(400) COLLATE pg_catalog."default",
    update_dt timestamp with time zone,
    del_dt timestamp with time zone,
    use_yn character(18) COLLATE pg_catalog."default",
    CONSTRAINT "xpk연계_마스터" PRIMARY KEY (cd_cl, cd)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_con_mst
    OWNER to airflow_user;