from flask import Blueprint
from utils.datetime_utils import get_kst_now

today_bp = Blueprint('today', __name__)

@today_bp.route('/api/today_date')
def get_today_date():
    today = get_kst_now().strftime('%Y-%m-%d')
    return {'today_date': today}
