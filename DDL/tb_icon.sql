



CREATE TABLE IF NOT EXISTS public.tb_icon
(
    icon_id integer NOT NULL DEFAULT nextval('tb_icons_icon_id_seq'::regclass),
    icon_cd text COLLATE pg_catalog."default" NOT NULL,
    icon_nm character varying(50) COLLATE pg_catalog."default" NOT NULL,
    icon_expl character varying(255) COLLATE pg_catalog."default",
    icon_cre_dt timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    icon_dsp_yn boolean DEFAULT true,
    CONSTRAINT tb_icons_pkey PRIMARY KEY (icon_id),
    CONSTRAINT tb_icons_icon_code_key UNIQUE (icon_cd)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_icon
    OWNER to etl_user;