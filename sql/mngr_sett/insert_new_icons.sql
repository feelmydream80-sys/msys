
INSERT INTO tb_icon (icon_cd, icon_nm, icon_expl, icon_dsp_yn) VALUES
('🔄', '진행률', '그룹 진행률 표시 아이콘', TRUE),
('🏆', '성공률', '그룹 성공률 표시 아이콘', TRUE)
ON CONFLICT (icon_cd) DO NOTHING;