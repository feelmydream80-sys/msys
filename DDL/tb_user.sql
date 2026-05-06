



CREATE TABLE IF NOT EXISTS public.tb_user
(
    user_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    user_pwd character varying(255) COLLATE pg_catalog."default" NOT NULL,
    acc_sts character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'PENDING'::character varying,
    acc_cre_dt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    acc_apr_dt timestamp with time zone,
    CONSTRAINT tb_users_pkey PRIMARY KEY (user_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_user
    OWNER to etl_user;