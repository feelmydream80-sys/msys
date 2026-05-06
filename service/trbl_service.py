                         
"""
Trouble and Failure History Business Logic
Handles fetching and processing data related to system troubles and failures.
"""
import logging
from typing import Optional, List, Dict
from mapper.trbl_mapper import TrblMapper
from msys.database import get_db_connection

class TrblService:
    """
    Provides methods to retrieve data for trouble analysis.
    """

    def __init__(self, db_connection):
        self.conn = db_connection
        self.trbl_mapper = TrblMapper(db_connection)

    def get_trouble_list(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
        """
        Fetches a list of all troubles from the Mapper.
        """
        logging.info(f"▶ Service: get_trouble_list called (Start: {start_date}, End: {end_date})")
        try:
            data = self.trbl_mapper.get_all_troubles(start_date, end_date)
            logging.info(f"✅ Service: Mapper returned {len(data)} trouble records.")
            return data
        except Exception as e:
            logging.error(f"❌ Service: Error in get_trouble_list: {e}", exc_info=True)
            raise

    def get_hourly_trouble_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
        """
        Fetches hourly trouble statistics from the Mapper.
        """
        logging.info(f"▶ Service: get_hourly_trouble_stats called (Start: {start_date}, End: {end_date})")
        try:
            data = self.trbl_mapper.get_hourly_trouble_stats(start_date, end_date)
            logging.info(f"✅ Service: Mapper returned {len(data)} hourly trouble stats.")
            return data
        except Exception as e:
            logging.error(f"❌ Service: Error in get_hourly_trouble_stats: {e}", exc_info=True)
            raise

    def get_trouble_hourly_by_status(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        Fetches hourly trouble data, grouped by status, from the Mapper.
        """
        logging.info(f"▶ Service: get_trouble_hourly_by_status called (Start: {start_date}, End: {end_date}, Jobs: {job_ids})")
        try:
            data = self.trbl_mapper.get_trouble_hourly_by_status(start_date, end_date, job_ids)
            logging.info(f"✅ Service: Mapper returned {len(data)} hourly trouble records by status.")
            return data
        except Exception as e:
            logging.error(f"❌ Service: Error in get_trouble_hourly_by_status: {e}", exc_info=True)
            raise

    def get_success_rate_trend_by_job(self, start_date: Optional[str] = None, end_date: Optional[str] = None, job_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        Fetches the success rate trend data by Job ID from the Mapper.
        """
        logging.info(f"▶ Service: get_success_rate_trend_by_job called (Start: {start_date}, End: {end_date}, Jobs: {job_ids})")
        try:
            data = self.trbl_mapper.get_success_rate_trend_by_job(start_date, end_date, job_ids)
            logging.info(f"✅ Service: Mapper returned {len(data)} success rate trend records.")
            return data
        except Exception as e:
            logging.error(f"❌ Service: Error in get_success_rate_trend_by_job: {e}", exc_info=True)
            raise
