
ALTER TABLE public.tb_con_hist DISABLE TRIGGER trg_log_con_hist_changes;


INSERT INTO public.tb_con_hist (job_id, con_id, rqs_info, start_dt, execution_dt, end_dt, status, trbl_hist_no)
VALUES 
('CD101', 'manual__' || to_char(CURRENT_DATE, 'YYYY-MM-DD') || 'T04:51:33.630188+00:00', '총 요청 수: 10, 실패: 0', (CURRENT_DATE || ' 13:51:38+09')::timestamptz, NULL, (CURRENT_DATE || ' 13:51:48+09')::timestamptz, 'CD901', NULL),
('CD102', 'manual__' || to_char(CURRENT_DATE, 'YYYY-MM-DD') || 'T07:16:25.026580+00:00', '총 요청 수: 44, 실패: 0', (CURRENT_DATE || ' 16:16:29+09')::timestamptz, NULL, (CURRENT_DATE || ' 16:16:40+09')::timestamptz, 'CD901', NULL),
('CD103', 'scheduled__' || to_char(CURRENT_DATE, 'YYYY-MM-DD') || 'T07:00:00+00:00', '총 요청 수: 27912, 실패: 0', (CURRENT_DATE || ' 16:00:03+09')::timestamptz, NULL, (CURRENT_DATE || ' 16:49:41+09')::timestamptz, 'CD901', NULL),
('CD104', 'scheduled__' || to_char(CURRENT_DATE, 'YYYY-MM-DD') || 'T06:00:00+00:00', '총 요청 수: 44, 실패: 0', (CURRENT_DATE || ' 15:00:04.197097+09')::timestamptz, NULL, (CURRENT_DATE || ' 15:00:42.293544+09')::timestamptz, 'CD901', NULL);


ALTER TABLE public.tb_con_hist ENABLE TRIGGER trg_log_con_hist_changes;