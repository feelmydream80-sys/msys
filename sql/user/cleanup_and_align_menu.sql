
DELETE FROM TB_USER_AUTH_CTRL WHERE MENU_ID = 'card_summary.card_summary_page';
DELETE FROM TB_MENU WHERE MENU_ID = 'card_summary.card_summary_page';



UPDATE TB_USER_AUTH_CTRL SET MENU_ID = 'mngr_sett' WHERE MENU_ID = 'admin';

UPDATE TB_MENU SET MENU_ID = 'mngr_sett' WHERE MENU_ID = 'admin';
