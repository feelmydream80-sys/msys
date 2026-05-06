                      
"""
DAO for handling data specifications in the database.
"""
import logging
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dao.sql_loader import load_sql

class DataSpecDAO:
    """
    Data Access Object for data specifications.
    Handles all database operations for TB_DATA_SPEC and TB_DATA_SPEC_PARM tables.
    """
    def __init__(self, db_connection):
        self.conn = db_connection
        self.logger = logging.getLogger(self.__class__.__name__)

    def get_all_specs(self) -> List[Dict]:
        """Retrieves all data specifications."""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(load_sql('data_spec/select_all_specs.sql'))
                specs = cur.fetchall()
                return [dict(row) for row in specs]
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error fetching all specs: {e}", exc_info=True)
            raise

    def get_spec_by_id(self, spec_id: int) -> Optional[Dict]:
        """Retrieves a single data specification and its parameters by ID."""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(load_sql('data_spec/select_spec_by_id.sql'), (spec_id,))
                spec = cur.fetchone()
                if not spec:
                    return None
                
                cur.execute(load_sql('data_spec/select_params_by_spec_id.sql'), (spec_id,))
                params = cur.fetchall()
                spec['params'] = [dict(row) for row in params]
                return dict(spec)
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error fetching spec by ID {spec_id}: {e}", exc_info=True)
            raise

    def create_spec(self, spec_data: Dict, params_data: List[Dict]) -> int:
        """Creates a new data specification and its parameters."""
        try:
            with self.conn.cursor() as cur:
                spec_values = (
                    spec_data.get('data_name'),
                    spec_data.get('description'),
                    spec_data.get('api_url'),
                    spec_data.get('provider'),
                    spec_data.get('keywords'),
                    spec_data.get('reference_doc_url'),
                    spec_data.get('password')
                )
                cur.execute(load_sql('data_spec/insert_spec.sql'), spec_values)
                spec_id = cur.fetchone()[0]

                for param in params_data:
                    param_values = (
                        spec_id,
                        param.get('parm_tp'),
                        param.get('parm_nm_krn'),
                        param.get('parm_nm_eng'),
                        param.get('expl'),
                        param.get('ncsr_yn')
                    )
                    cur.execute(load_sql('data_spec/insert_param.sql'), param_values)
                
                self.logger.info(f"✅ DAO: Created spec with ID: {spec_id}")
                return spec_id
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error creating spec: {e}", exc_info=True)
            raise

    def update_spec(self, spec_id: int, spec_data: Dict, params_data: List[Dict]) -> bool:
        """Updates an existing data specification and its parameters."""
        try:
            with self.conn.cursor() as cur:
                                        
                if 'password' in spec_data and spec_data['password']:
                    query = load_sql('data_spec/update_spec_with_password.sql')
                    values = (
                        spec_data.get('data_name'), spec_data.get('description'),
                        spec_data.get('api_url'), spec_data.get('provider'),
                        spec_data.get('keywords'), spec_data.get('reference_doc_url'),
                        spec_data.get('password'), spec_id
                    )
                else:
                    query = load_sql('data_spec/update_spec_without_password.sql')
                    values = (
                        spec_data.get('data_name'), spec_data.get('description'),
                        spec_data.get('api_url'), spec_data.get('provider'),
                        spec_data.get('keywords'), spec_data.get('reference_doc_url'),
                        spec_id
                    )
                cur.execute(query, values)
                
                                           
                cur.execute(load_sql('data_spec/delete_params_by_spec_id.sql'), (spec_id,))
                
                                      
                for param in params_data:
                    param_values = (
                        spec_id,
                        param.get('parm_tp'), param.get('parm_nm_krn'),
                        param.get('parm_nm_eng'), param.get('expl'),
                        param.get('ncsr_yn')
                    )
                    cur.execute(load_sql('data_spec/insert_param.sql'), param_values)
                
                self.logger.info(f"✅ DAO: Updated spec and params for ID: {spec_id}")
                return cur.rowcount > 0
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error updating spec ID {spec_id}: {e}", exc_info=True)
            raise

    def delete_spec(self, spec_id: int) -> bool:
        """Deletes a data specification."""
        try:
            with self.conn.cursor() as cur:
                cur.execute(load_sql('data_spec/delete_spec.sql'), (spec_id,))
                return cur.rowcount > 0
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error deleting spec ID {spec_id}: {e}", exc_info=True)
            raise

    def get_password_hash(self, spec_id: int) -> Optional[str]:
        """Retrieves the password hash for a specific spec."""
        try:
            with self.conn.cursor() as cur:
                cur.execute(load_sql('data_spec/select_password_by_id.sql'), (spec_id,))
                result = cur.fetchone()
                return result[0] if result else None
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error getting password hash for spec ID {spec_id}: {e}", exc_info=True)
            raise

    def find_by_data_name(self, data_name: str) -> Optional[Dict]:
        """Finds a spec by its data_name."""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(load_sql('data_spec/select_spec_by_data_name.sql'), (data_name,))
                result = cur.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.logger.error(f"❌ DAO: Error finding spec by data name {data_name}: {e}", exc_info=True)
            raise
