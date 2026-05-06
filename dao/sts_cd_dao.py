from __future__ import annotations
from typing import Optional, List, Dict
from msys.database import get_db_connection
import logging


class StsCdDAO:
    """
    상태코드 마스터 DAO
    ✅ 표준 명명 규칙 100% 준수
    ✅ CD900 계열 전용
    """
    
    @staticmethod
    def get_all() -> List[Dict]:
        """사용중인 모든 상태코드 목록 조회"""
        try:
            db = get_db_connection()
            cursor = db.cursor()
            cursor.execute("""
                SELECT 
                    s.CD, 
                    s.NM, 
                    s.DESCR, 
                    s.COLR,
                    s.ICON_CD,
                    s.ORD,
                    s.BG_COLR,
                    s.TXT_COLR,
                    i.ICON_NM
                FROM TB_STS_CD_MST s
                LEFT JOIN TB_ICON i ON s.ICON_CD = i.ICON_CD
                ORDER BY s.ORD, s.CD
            """)
            
            columns = [desc[0].lower() for desc in cursor.description]
            rows = cursor.fetchall()

            result = [dict(zip(columns, row)) for row in rows]

            return result
        except Exception as e:
            logging.error(f"StsCdDAO.get_all() error: {e}", exc_info=True)
            return []
    
    @staticmethod
    def get_by_cd(cd: str) -> Optional[Dict]:
        """코드로 상태정보 조회"""
        try:
            db = get_db_connection()
            cursor = db.cursor()
            cursor.execute("""
                SELECT CD, NM, DESCR, COLR, ICON_CD
                FROM TB_STS_CD_MST 
                WHERE CD = %s
            """, (cd,))
            
            row = cursor.fetchone()
            if not row:
                return None

            columns = [desc[0].lower() for desc in cursor.description]
            return dict(zip(columns, row))
        except Exception as e:
            logging.error(f"StsCdDAO.get_by_cd() error: {e}", exc_info=True)
            return None
    
    @staticmethod
    def is_valid_cd(cd: str) -> bool:
        """유효한 상태코드인지 확인"""
        try:
            db = get_db_connection()
            cursor = db.cursor()
            cursor.execute("""
                SELECT 1 FROM TB_STS_CD_MST 
                WHERE CD = %s
            """, (cd,))
            return cursor.fetchone() is not None
        except Exception as e:
            logging.error(f"StsCdDAO.is_valid_cd() error: {e}", exc_info=True)
            return False

    @staticmethod
    def get_synced_status_codes() -> List[Dict]:
        """
        tb_con_mst(CD900 그룹)을 기준으로 tb_sts_cd_mst와 join하여 조회합니다.
        tb_con_mst: cd, cd_nm 제공 (마스터 데이터)
        tb_sts_cd_mst: icon_cd, bg_colr, txt_colr 제공 (UI 설정값)

        Returns:
            List[Dict]: 동기화된 상태코드 목록
                [
                    {
                        'cd': 'CD901',
                        'nm': '성공',  # tb_con_mst.cd_nm
                        'icon_cd': 'check',
                        'bg_colr': '#F3F4F6',
                        'txt_colr': '#374151',
                        'icon_nm': 'Check Icon'  # TB_ICON join
                    }
                ]
        """
        try:
            db = get_db_connection()
            cursor = db.cursor()
            cursor.execute("""
                SELECT
                    m.CD,
                    m.CD_NM AS NM,
                    s.ICON_CD,
                    s.BG_COLR,
                    s.TXT_COLR,
                    i.ICON_NM
                FROM TB_CON_MST m
                LEFT JOIN TB_STS_CD_MST s ON m.CD = s.CD
                LEFT JOIN TB_ICON i ON s.ICON_CD = i.ICON_CD
                WHERE m.CD_CL = 'CD900'
                  AND m.CD > 'CD900'
                  AND m.CD <= 'CD999'
                ORDER BY m.CD
            """)

            columns = [desc[0].lower() for desc in cursor.description]
            rows = cursor.fetchall()

            result = [dict(zip(columns, row)) for row in rows]
            logging.info(f"StsCdDAO.get_synced_status_codes() 성공: {len(result)}개 조회")
            return result

        except Exception as e:
            logging.error(f"StsCdDAO.get_synced_status_codes() 실패: {e}", exc_info=True)
            return []

    @staticmethod
    def sync_missing_codes_from_con_mst() -> int:
        """
        tb_con_mst의 CD900~CD999 중 tb_sts_cd_mst에 없는 CD를
        기본값으로 자동 삽입하고 삽입된 건수를 반환합니다.

        Returns:
            int: 새로 삽입된 코드 건수
        """
        try:
            db = get_db_connection()
            cursor = db.cursor()

                                                                         
            cursor.execute("""
                SELECT m.CD
                FROM TB_CON_MST m
                LEFT JOIN TB_STS_CD_MST s ON m.CD = s.CD
                WHERE m.CD_CL = 'CD900'
                  AND m.CD > 'CD900'
                  AND m.CD <= 'CD999'
                  AND s.CD IS NULL
            """)

            missing_codes = cursor.fetchall()

            if not missing_codes:
                logging.info("StsCdDAO.sync_missing_codes_from_con_mst() 동기화할 새로운 코드 없음")
                return 0

            inserted_count = 0
            for (cd,) in missing_codes:
                                                   
                try:
                    ord_value = int(cd.replace('CD', ''))
                except ValueError:
                    ord_value = 999

                cursor.execute("""
                    INSERT INTO TB_STS_CD_MST (
                        CD, NM, DESCR, COLR, ICON_CD, ORD, BG_COLR, TXT_COLR,
                        REG_DT, UPD_DT
                    ) VALUES (%s, '', '', '', '', %s, '#F3F4F6', '#374151',
                              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (cd, ord_value))
                inserted_count += 1
                logging.info(f"StsCdDAO: 새로운 상태코드 자동 삽입 - {cd}")

            db.commit()
            logging.info(f"StsCdDAO.sync_missing_codes_from_con_mst() 성공: {inserted_count}개 삽입")
            return inserted_count

        except Exception as e:
            logging.error(f"StsCdDAO.sync_missing_codes_from_con_mst() 실패: {e}", exc_info=True)
            if 'db' in locals():
                db.rollback()
            raise

    @staticmethod
    def upsert_status_code(data: dict) -> bool:
        """
        TB_STS_CD_MST에 상태코드 UI 설정값을 upsert합니다.
        nm, descr 등은 tb_con_mst에서 관리하므로 저장하지 않습니다.

        Args:
            data: 상태코드 UI 설정 데이터
                {
                    'cd': 'CD901',
                    'icon_cd': 'check',      # 선택적
                    'bg_colr': '#F3F4F6',    # 선택적 (기본값: '#F3F4F6')
                    'txt_colr': '#374151'    # 선택적 (기본값: '#374151')
                }

        Returns:
            bool: 성공 여부
        """
        try:
            db = get_db_connection()
            cursor = db.cursor()

                      
            cd = data.get('cd')
            if not cd:
                raise ValueError("상태코드(cd)는 필수입니다.")

                                               
            try:
                ord_value = int(cd.replace('CD', ''))
            except ValueError:
                ord_value = 999

                                               
            cursor.execute("""
                INSERT INTO TB_STS_CD_MST (
                    CD, NM, DESCR, COLR, ICON_CD, ORD, BG_COLR, TXT_COLR,
                    REG_DT, UPD_DT
                ) VALUES (%s, '', '', '', %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(CD) DO UPDATE SET
                    ICON_CD = EXCLUDED.ICON_CD,
                    BG_COLR = EXCLUDED.BG_COLR,
                    TXT_COLR = EXCLUDED.TXT_COLR,
                    UPD_DT = CURRENT_TIMESTAMP
            """, (
                cd,
                data.get('icon_cd', ''),
                ord_value,
                data.get('bg_colr', '#F3F4F6'),
                data.get('txt_colr', '#374151')
            ))

            db.commit()
            logging.info(f"StsCdDAO.upsert_status_code() 성공: CD={cd}")
            return True

        except Exception as e:
            logging.error(f"StsCdDAO.upsert_status_code() 실패: {e}", exc_info=True)
            if 'db' in locals():
                db.rollback()
            raise