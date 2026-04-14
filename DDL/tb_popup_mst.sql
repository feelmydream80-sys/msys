-- TB_POPUP_MST: 팝업(공지사항) 마스터 테이블
-- 팝업 관리 및 사용자 표시를 위한 테이블

CREATE TABLE TB_POPUP_MST (
    POPUP_ID        INT AUTO_INCREMENT PRIMARY KEY COMMENT '팝업 ID (PK)',
    TITL            VARCHAR(200) NOT NULL COMMENT '팝업 제목',
    CONT            TEXT COMMENT '팝업 내용 (HTML 가능)',
    IMG_PATH        VARCHAR(500) COMMENT '이미지 경로 (있을 경우)',
    LNK_URL         VARCHAR(500) COMMENT '링크 URL (클릭 시 이동)',
    
    -- 기간 설정
    START_DT        DATETIME NOT NULL COMMENT '팝업 시작일시',
    END_DT          DATETIME NOT NULL COMMENT '팝업 종료일시',
    
    -- 표시 설정
    USE_YN          CHAR(1) DEFAULT 'Y' COMMENT '사용 여부 (Y/N)',
    DISP_ORD        INT DEFAULT 999 COMMENT '표시 순서 (낮을수록 우선)',
    DISP_TYPE       VARCHAR(20) DEFAULT 'MODAL' COMMENT '표시 타입 (MODAL/SLIDE/BANNER)',
    
    -- 디자인 설정
    WIDTH           INT DEFAULT 500 COMMENT '팝업 너비 (px)',
    HEIGHT          INT COMMENT '팝업 높이 (px, NULL이면 auto)',
    BG_COLR         VARCHAR(7) DEFAULT '#FFFFFF' COMMENT '배경색',
    
    -- "오늘 하루 보지 않기" 설정
    HIDE_OPT_YN     CHAR(1) DEFAULT 'Y' COMMENT '숨김 옵션 표시 여부',
    HIDE_HOURS      INT DEFAULT 24 COMMENT '숨김 유지 시간 (시간)',
    
    -- 타겟 설정
    TARGET_ROLE     VARCHAR(50) DEFAULT 'ALL' COMMENT '대상 역할 (ALL/ADMIN/USER)',
    TARGET_PAGES    VARCHAR(500) DEFAULT 'ALL' COMMENT '표시 페이지 (쉼표구분, ALL=전체)',
    
    -- 메타데이터
    REG_DT          DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    REG_USER_ID     VARCHAR(50) COMMENT '등록자 ID',
    UPD_DT          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    UPD_USER_ID     VARCHAR(50) COMMENT '수정자 ID',
    DEL_YN          CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    
    -- 인덱스
    INDEX IDX_TB_POPUP_MST_USE_YN (USE_YN),
    INDEX IDX_TB_POPUP_MST_DATE (START_DT, END_DT),
    INDEX IDX_TB_POPUP_MST_ORD (DISP_ORD)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='팝업 마스터 테이블';
