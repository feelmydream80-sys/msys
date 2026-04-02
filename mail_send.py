"""
Email sending functionality extracted from Airflow's ServiceMonitor (mail_s.txt)
Adapted for Flask web application
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import logging
from config import config

# Configure logging
logger = logging.getLogger(__name__)

def send_email(to, subject, html_content):
    """
    Send email using SMTP server
    :param to: Recipient email address
    :param subject: Email subject
    :param html_content: HTML email body
    """
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['From'] = config.MAIL_SENDER
        msg['To'] = to
        msg['Subject'] = subject
        
        # Attach HTML content
        part_html = MIMEText(html_content, 'html')
        msg.attach(part_html)
        
        # Connect to SMTP server and send email
        with smtplib.SMTP(config.MAIL_SERVER, config.MAIL_PORT) as server:
            if config.MAIL_USE_TLS:
                server.starttls()
            if config.MAIL_USERNAME and config.MAIL_PASSWORD:
                server.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
            server.sendmail(config.MAIL_SENDER, to, msg.as_string())
        
        logger.info(f"Email sent successfully to: {to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {str(e)}")
        return False

def create_api_key_expiry_email(api_key_data):
    """
    Create email content for API key expiry notification
    Following the structure from Airflow's ServiceMonitor
    :param api_key_data: API key information dictionary
    :return: Email subject and HTML body
    """
    # Subject: [빅데이터 플랫폼] API 키 만료 알림: {CD} - {만료일}
    subject = f"[빅데이터 플랫폼] API 키 만료 알림: {api_key_data['cd']} - {api_key_data['expiry_dt']}"
    
    # Body: HTML format with proper line breaks (following mail_s.txt structure)
    body = f"""
API 키 '{api_key_data['cd']}'가 곧 만료됩니다.<br/> <br/>
API 키 코드: {api_key_data['cd']}<br/> <br/>
만료일: {api_key_data['expiry_dt']}<br/> <br/>
남은 기간: {api_key_data['days_remaining']}일<br/> <br/>
등록일: {api_key_data['start_dt']}<br/> <br/>
기간: {api_key_data['due']}년<br/> <br/>

빠른 조치가 필요합니다. API 키를 갱신해 주세요.<br/> <br/>

감사합니다.<br/>
빅데이터 플랫폼 관리팀
"""
    
    return subject, body

def validate_email_address(email):
    """
    Validate email address format
    :param email: Email address to validate
    :return: True if valid, False otherwise
    """
    if not email:
        return False
    
    email = email.strip()
    if '@' not in email or '.' not in email.split('@')[-1]:
        return False
    
    return True