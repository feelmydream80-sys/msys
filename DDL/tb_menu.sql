



CREATE TABLE IF NOT EXISTS public.tb_menu
(
    menu_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    menu_nm character varying(100) COLLATE pg_catalog."default" NOT NULL,
    menu_url character varying(255) COLLATE pg_catalog."default" NOT NULL,
    menu_order integer,
    CONSTRAINT tb_menus_pkey PRIMARY KEY (menu_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_menu
    OWNER to etl_user;