

CREATE TABLE TB_API_KEY_MNGR_MAIL_SCHD (
    schd_id SERIAL PRIMARY KEY,
    schd_tp VARCHAR(20) NOT NULL,
    schd_cycle INTEGER NOT NULL,
    schd_hour INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_dt TIMESTAMP,
    last_run_result VARCHAR(20),
    reg_dt TIMESTAMP DEFAULT NOW(),
    upd_dt TIMESTAMP DEFAULT NOW()
);


CREATE INDEX idx_mail_schd_tp ON TB_API_KEY_MNGR_MAIL_SCHD(schd_tp);
CREATE INDEX idx_mail_schd_active ON TB_API_KEY_MNGR_MAIL_SCHD(is_active);


INSERT INTO TB_API_KEY_MNGR_MAIL_SCHD (schd_tp, schd_cycle, schd_hour, is_active)
VALUES 
    ('30일전', 15, 23, TRUE),
    ('7일전', 3, 9, TRUE),
    ('당일', 1, 9, TRUE)
ON CONFLICT DO NOTHING;