



CREATE TABLE IF NOT EXISTS public.tb_user_auth_ctrl
(
    auth_id integer NOT NULL DEFAULT nextval('tb_user_access_control_id_seq'::regclass),
    user_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    menu_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    auth_yn boolean NOT NULL DEFAULT true,
    CONSTRAINT tb_user_access_control_pkey PRIMARY KEY (auth_id),
    CONSTRAINT tb_user_access_control_user_id_menu_id_key UNIQUE (user_id, menu_id),
    CONSTRAINT tb_user_access_control_menu_id_fkey FOREIGN KEY (menu_id)
        REFERENCES public.tb_menu (menu_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT tb_user_access_control_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.tb_user (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_user_auth_ctrl
    OWNER to etl_user;