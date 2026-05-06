                 
"""
DAO for handling icon data in the database.
"""
import logging
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dao.sql_loader import load_sql

class IconDAO:
    """
    Data Access Object for icons.
    Handles all database operations for the TB_ICON table.
    """
    def __init__(self, db_connection):
        self.conn = db_connection
        self.logger = logging.getLogger(self.__class__.__name__)

    def get_all_icons(self) -> List[Dict]:
        """
        Retrieves all icons from the database.
        """
        query = load_sql('icon/get_all_icons.sql')
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                results = cur.fetchall()
                return [dict(row) for row in results]
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error fetching all icons: {e}", exc_info=True)
            raise

    def get_icon_by_code(self, icon_code: str) -> Optional[Dict]:
        """
        Retrieves a single icon from the database by its code.
        """
        query = "SELECT * FROM TB_ICON WHERE ICON_CD = %s"
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (icon_code,))
                result = cur.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error fetching icon by code {icon_code}: {e}", exc_info=True)
            raise

    def insert_icon(self, icon_data: Dict):
        """
        Inserts a new icon into the database.
        Handles both cases with and without ICON_ID.
        """
        if 'ICON_ID' in icon_data and icon_data['ICON_ID']:
                                 
            query = """
                INSERT INTO TB_ICON (ICON_ID, ICON_CD, ICON_NM, ICON_EXPL, ICON_DSP_YN)
                VALUES (%s, %s, %s, %s, %s)
            """
            values = (
                icon_data.get('ICON_ID'),
                icon_data.get('ICON_CD'),
                icon_data.get('ICON_NM'),
                icon_data.get('ICON_EXPL'),
                icon_data.get('ICON_DSP_YN', 'Y')
            )
        else:
                                                      
            query = """
                INSERT INTO TB_ICON (ICON_CD, ICON_NM, ICON_EXPL, ICON_DSP_YN)
                VALUES (%s, %s, %s, %s)
            """
            values = (
                icon_data.get('ICON_CD'),
                icon_data.get('ICON_NM'),
                icon_data.get('ICON_EXPL'),
                icon_data.get('ICON_DSP_YN', 'Y')
            )
        
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, values)
                self.logger.info(f"✅ DAO: Insert executed for ICON_CD '{icon_data.get('ICON_CD')}'.")
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error inserting icon {icon_data.get('ICON_CD')}: {e}", exc_info=True)
            raise

    def update_icon(self, icon_data: Dict):
        """
        Updates an existing icon in the database.
        """
        query = load_sql('icon/update_icon.sql')
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, icon_data)
                self.logger.info(f"✅ DAO: Update executed for ICON_ID {icon_data.get('ICON_ID')}.")
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error updating icon {icon_data.get('ICON_ID')}: {e}", exc_info=True)
            raise

    def delete_icon(self, icon_id: int):
        """
        Deletes an icon from the database by its ID.
        """
        query = load_sql('icon/delete_icon.sql')
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, (icon_id,))
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error deleting icon ID {icon_id}: {e}", exc_info=True)
            raise

    def update_icon_display_status(self, icon_id: int, display_yn: str):
        """
        Updates the display status of an icon.
        """
        query = load_sql('icon/update_icon_display_status.sql')
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, (display_yn, icon_id))
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error updating display status for icon ID {icon_id}: {e}", exc_info=True)
            raise


    def delete_all_icons(self):
        """
        Deletes all icons from the database.
        """
        query = "DELETE FROM TB_ICON"
        try:
            with self.conn.cursor() as cur:
                cur.execute(query)
                self.logger.info(f"✅ DAO: All icons have been deleted. Rows affected: {cur.rowcount}")
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error deleting all icons: {e}", exc_info=True)
            raise
