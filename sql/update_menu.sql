



INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'dashboard', '대시보드', '/dashboard', 1
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'dashboard');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'jandi', '잔디', '/jandi', 2
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'jandi');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'raw_data', '원본 데이터', '/raw_data', 3
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'raw_data');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'chart_analysis', '차트 분석', '/chart_analysis', 4
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'chart_analysis');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'data_analysis', '데이터 분석', '/data_analysis', 5
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'data_analysis');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'data_spec', '데이터 명세서', '/data_spec', 6
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'data_spec');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'api_test', 'API 테스트', '/api_test', 7
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'api_test');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'admin', '관리자 설정', '/mngr_sett', 8
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'admin');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'airflow', 'Airflow', '/airflow', 9
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'airflow');


INSERT INTO tb_menu (menu_id, menu_nm, menu_url, menu_order)
SELECT 'kafka_ui', 'Kafka UI', '/kafka_ui', 10
WHERE NOT EXISTS (SELECT 1 FROM tb_menu WHERE menu_id = 'kafka_ui');
