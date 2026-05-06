"""
Centralized configuration for MSYS Flask application.
All application settings are managed here for better maintainability.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

                            
load_dotenv()

class Config:
    """Centralized configuration class for the Flask application."""

                         
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'your_very_secret_key_here')
    DEBUG = os.getenv('FLASK_DEBUG', '0').lower() in ['true', '1']
    HOST = os.getenv('FLASK_HOST', 'cib040l5')
    PORT = int(os.getenv('FLASK_PORT', '18080'))

                             
    AUTH_ENABLED = True

                      
    PERMANENT_SESSION_LIFETIME_DAYS = int(os.getenv('ADMIN_SESSION_LIFETIME_DAYS', '7'))
    DEFAULT_SESSION_LIFETIME_MINUTES = int(os.getenv('DEFAULT_SESSION_LIFETIME_MINUTES', '20'))

                            
    DB_CONFIG = {
        "host": os.getenv("DB_HOST"),
        "dbname": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT")
    }

                      
    LOG_DIR = os.getenv('LOG_DIR', 'log')

                         
    CONTACT_INFO = os.getenv('CONTACT_INFO')

                        
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() in ['true', '1']
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_SENDER = os.getenv('MAIL_SENDER', '')

                          
    MENU_CACHE_ENABLED = True
    
                   
    BASE_URL = os.getenv('BASE_URL', 'http://127.0.0.1:18080/')
    TEST_USER_ID = os.getenv('TEST_USER_ID', 'test3')
    TEST_USER_PASSWORD = os.getenv('TEST_USER_PASSWORD', 'test3test3!')
    ADMIN_USER_ID = os.getenv('ADMIN_USER_ID', 'admin')
    ADMIN_USER_PASSWORD = os.getenv('ADMIN_USER_PASSWORD', 'admin')

    @classmethod
    def get_permanent_session_lifetime(cls):
        """Get the permanent session lifetime as a timedelta object."""
        return timedelta(days=cls.PERMANENT_SESSION_LIFETIME_DAYS)

    @classmethod
    def get_default_session_lifetime(cls):
        """Get the default session lifetime for non-admin users."""
        return timedelta(minutes=cls.DEFAULT_SESSION_LIFETIME_MINUTES)

                        
config = Config()
