



CREATE TABLE IF NOT EXISTS public.tb_data_spec
(
    id integer NOT NULL DEFAULT nextval('tb_data_spec_id_seq'::regclass),
    data_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    api_url character varying(2048) COLLATE pg_catalog."default",
    provider character varying(255) COLLATE pg_catalog."default",
    keywords character varying(1024) COLLATE pg_catalog."default",
    reference_doc_url character varying(2048) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    password character varying(256) COLLATE pg_catalog."default",
    CONSTRAINT tb_data_spec_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tb_data_spec
    OWNER to etl_user;

COMMENT ON TABLE public.tb_data_spec
    IS 'data.go.kr 등에서 가져온 API의 명세 정보를 저장하는 메인 테이블';

COMMENT ON COLUMN public.tb_data_spec.id
    IS '고유 식별자';

COMMENT ON COLUMN public.tb_data_spec.data_name
    IS '데이터 명칭';

COMMENT ON COLUMN public.tb_data_spec.description
    IS '데이터에 대한 상세 설명';

COMMENT ON COLUMN public.tb_data_spec.api_url
    IS 'API 요청 주소 (Endpoint)';

COMMENT ON COLUMN public.tb_data_spec.provider
    IS '데이터 제공 기관';

COMMENT ON COLUMN public.tb_data_spec.keywords
    IS '데이터 검색을 위한 키워드 (쉼표로 구분)';

COMMENT ON COLUMN public.tb_data_spec.reference_doc_url
    IS '참고문서 다운로드 URL';

COMMENT ON COLUMN public.tb_data_spec.created_at
    IS '레코드 생성 시각';

COMMENT ON COLUMN public.tb_data_spec.updated_at
    IS '레코드 마지막 수정 시각';