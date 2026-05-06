



CREATE TABLE IF NOT EXISTS public.tb_mngr_sett
(
    cd character varying(50) COLLATE pg_catalog."default" NOT NULL,
    cnn_failr_thrs_val integer DEFAULT 3,
    cnn_warn_thrs_val integer DEFAULT 2,
    cnn_failr_icon_id integer,
    cnn_failr_wrd_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#dc3545'::character varying,
    cnn_warn_icon_id integer,
    cnn_warn_wrd_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#ffc107'::character varying,
    cnn_sucs_icon_id integer,
    cnn_sucs_wrd_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#28a745'::character varying,
    dly_sucs_rt_thrs_val integer DEFAULT 80,
    dd7_sucs_rt_thrs_val integer DEFAULT 75,
    mthl_sucs_rt_thrs_val integer DEFAULT 70,
    mc6_sucs_rt_thrs_val integer DEFAULT 65,
    yy1_sucs_rt_thrs_val integer DEFAULT 60,
    sucs_rt_sucs_icon_id integer,
    sucs_rt_sucs_wrd_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#28a745'::character varying,
    sucs_rt_warn_icon_id integer,
    sucs_rt_warn_wrd_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#ffc107'::character varying,
    chrt_prd_value integer DEFAULT 1,
    chrt_tp character varying(20) COLLATE pg_catalog."default" DEFAULT 'line'::character varying,
    chrt_dsp_job_id text COLLATE pg_catalog."default",
    chrt_dsp_yn boolean DEFAULT true,
    chrt_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#42A5F5'::character varying,
    grass_chrt_min_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#9be9a8'::character varying,
    grass_chrt_max_colr character varying(7) COLLATE pg_catalog."default" DEFAULT '#216e39'::character varying,
    CONSTRAINT tb_admin_settings_pkey PRIMARY KEY (cd)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_mngr_sett
    OWNER to etl_user;



CREATE OR REPLACE FUNCTION insert_mngr_sett_on_con_mst_insert()
RETURNS TRIGGER AS $$
DECLARE
    cd_number INTEGER;
BEGIN

    IF NOT EXISTS (SELECT 1 FROM tb_mngr_sett WHERE cd = NEW.cd) THEN

        IF NEW.cd LIKE 'CD%' AND LENGTH(NEW.cd) > 2 THEN

            BEGIN
                cd_number := SUBSTRING(NEW.cd, 3)::INTEGER;
                



                IF (cd_number >= 900 AND cd_number <= 999) OR (cd_number % 100 = 0) THEN
                    RETURN NEW;
                END IF;
            EXCEPTION 
                WHEN invalid_text_representation THEN

                    NULL;
            END;
        END IF;
        

       wprk ecs_wrd_colr,
            dly_sucs_rt_thrs_val,
            dd7_sucs_rt_thrs_val,
            mthl_sucs_rt_thrs_val,
            mc6_sucs_rt_thrs_val,
            yy1_sucs_rt_thrs_val,
            sucs_rt_sucs_icon_id,
            sucs_rt_sucs_wrd_colr,
            sucs_rt_warn_icon_id,
            sucs_rt_warn_wrd_colr,
            chrt_colr,
            chrt_dsp_yn,
            grass_chrt_min_colr,
            grass_chrt_max_colr
        ) VALUES (
            NEW.cd,
            5,
            3,
            2,
            '#dc3545',
            5,
            '#ffc107',
            1,
            '#28a745',
            95,
            90,
            85,
            80,
            75,
            1,
            '#28a745',
            5,
            '#ffc107',
            '#007bff',
            true,
            '#9be9a8',
            '#216e39'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_after_insert_con_mst
    AFTER INSERT ON tb_con_mst
    FOR EACH ROW
    EXECUTE FUNCTION insert_mngr_sett_on_con_mst_insert();























