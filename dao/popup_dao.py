# dao/popup_dao.py
"""
DAO for handling popup data in the database.
"""
import logging
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.datetime_utils import get_kst_now

class PopupDao:
    """
    Data Access Object for popups.
    Handles all database operations for the TB_POPUP_MST table.
    """
    def __init__(self, db_connection):
        self.conn = db_connection
        self.logger = logging.getLogger(self.__class__.__name__)

    def get_all_popups(self, include_inactive: bool = False) -> List[Dict]:
        """
        Retrieves all popups from the database.
        
        Args:
            include_inactive: If True, include inactive popups as well.
        
        Returns:
            List of popup dictionaries.
        """
        query = """
            SELECT popup_id, title, content, start_time, end_time, use_yn,
                   regr_id, reg_dtm, updr_id, upd_dtm
            FROM TB_POPUP_MST
        """
        if not include_inactive:
            query += " WHERE use_yn = 'Y'"
        query += " ORDER BY reg_dtm DESC"
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                results = cur.fetchall()
                return [dict(row) for row in results]
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error fetching all popups: {e}", exc_info=True)
            raise

    def get_popup_by_id(self, popup_id: int) -> Optional[Dict]:
        """
        Retrieves a single popup by its ID.
        
        Args:
            popup_id: The ID of the popup to retrieve.
        
        Returns:
            Popup dictionary if found, None otherwise.
        """
        query = """
            SELECT popup_id, title, content, start_time, end_time, use_yn,
                   regr_id, reg_dtm, updr_id, upd_dtm
            FROM TB_POPUP_MST
            WHERE popup_id = %s
        """
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (popup_id,))
                result = cur.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error fetching popup by ID {popup_id}: {e}", exc_info=True)
            raise

    def get_active_popups(self, current_time: str) -> List[Dict]:
        """
        Retrieves active popups that are currently visible.
        
        Args:
            current_time: Current time string in 'YYYY-MM-DD HH:MM:SS' format.
        
        Returns:
            List of active popup dictionaries.
        """
        query = """
            SELECT popup_id, title, content, start_time, end_time, use_yn,
                   regr_id, reg_dtm, updr_id, upd_dtm
            FROM TB_POPUP_MST
            WHERE use_yn = 'Y'
              AND start_time <= %s
              AND end_time >= %s
            ORDER BY reg_dtm DESC
        """
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (current_time, current_time))
                results = cur.fetchall()
                return [dict(row) for row in results]
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error fetching active popups: {e}", exc_info=True)
            raise

    def insert_popup(self, data: Dict) -> int:
        """
        Inserts a new popup into the database.
        
        Args:
            data: Dictionary containing popup data.
                Required keys: title, content, start_time, end_time, use_yn, regr_id
        
        Returns:
            The ID of the newly inserted popup.
        """
        query = """
            INSERT INTO TB_POPUP_MST (title, content, start_time, end_time, use_yn, regr_id, reg_dtm)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING popup_id
        """
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (
                    data.get('title'),
                    data.get('content'),
                    data.get('start_time'),
                    data.get('end_time'),
                    data.get('use_yn', 'Y'),
                    data.get('regr_id'),
                    get_kst_now().strftime('%Y-%m-%d %H:%M:%S')
                ))
                result = cur.fetchone()
                self.conn.commit()
                popup_id = result['popup_id'] if result else None
                self.logger.info(f"✅ DAO: Popup inserted with ID {popup_id}")
                return popup_id
        except psycopg2.Error as e:
            self.conn.rollback()
            self.logger.error(f"❌ DAO: Error inserting popup: {e}", exc_info=True)
            raise

    def update_popup(self, popup_id: int, data: Dict):
        """
        Updates an existing popup in the database.
        
        Args:
            popup_id: The ID of the popup to update.
            data: Dictionary containing updated popup data.
        """
        query = """
            UPDATE TB_POPUP_MST
            SET title = %s,
                content = %s,
                start_time = %s,
                end_time = %s,
                use_yn = %s,
                updr_id = %s,
                upd_dtm = %s
            WHERE popup_id = %s
        """
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, (
                    data.get('title'),
                    data.get('content'),
                    data.get('start_time'),
                    data.get('end_time'),
                    data.get('use_yn', 'Y'),
                    data.get('updr_id'),
                    get_kst_now().strftime('%Y-%m-%d %H:%M:%S'),
                    popup_id
                ))
            self.conn.commit()
            self.logger.info(f"✅ DAO: Popup {popup_id} updated")
        except psycopg2.Error as e:
            self.conn.rollback()
            self.logger.error(f"❌ DAO: Error updating popup {popup_id}: {e}", exc_info=True)
            raise

    def delete_popup(self, popup_id: int, user_id: str):
        """
        Deletes a popup from the database (soft delete by setting use_yn = 'N').
        
        Args:
            popup_id: The ID of the popup to delete.
            user_id: The ID of the user performing the deletion.
        """
        query = """
            UPDATE TB_POPUP_MST
            SET use_yn = 'N',
                updr_id = %s,
                upd_dtm = %s
            WHERE popup_id = %s
        """
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, (
                    user_id,
                    get_kst_now().strftime('%Y-%m-%d %H:%M:%S'),
                    popup_id
                ))
            self.conn.commit()
            self.logger.info(f"✅ DAO: Popup {popup_id} soft-deleted by user {user_id}")
        except psycopg2.Error as e:
            self.conn.rollback()
            self.logger.error(f"❌ DAO: Error deleting popup {popup_id}: {e}", exc_info=True)
            raise
