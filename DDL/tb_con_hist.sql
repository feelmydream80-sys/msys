



CREATE TABLE IF NOT EXISTS public.tb_con_hist
(
    job_id character varying(250) COLLATE pg_catalog."default" NOT NULL,
    con_id character varying(250) COLLATE pg_catalog."default" NOT NULL,
    rqs_info text COLLATE pg_catalog."default",
    start_dt timestamp with time zone,
    execution_dt timestamp with time zone,
    end_dt timestamp with time zone,
    status character varying(20) COLLATE pg_catalog."default",
    trbl_hist_no integer,
    CONSTRAINT "xpk연계_이력" PRIMARY KEY (con_id, job_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_con_hist
    OWNER to airflow_user;





CREATE OR REPLACE TRIGGER trg_log_con_hist_changes
    AFTER INSERT OR UPDATE 
    ON public.tb_con_hist
    FOR EACH ROW
    EXECUTE FUNCTION public.log_con_hist_changes();