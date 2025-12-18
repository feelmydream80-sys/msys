from flask import Blueprint, jsonify, session
from flask_login import login_required
from service.card_summary_service import CardSummaryService
from msys.database import get_db_connection
from routes.auth_routes import card_summary_required

card_summary_api_bp = Blueprint('card_summary_api', __name__, url_prefix='/api/card_summary')

@card_summary_api_bp.route('')
@login_required
@card_summary_required
def get_card_summary_data():
    """
    Provides card summary data as JSON.
    """
    db_connection = get_db_connection()
    service = CardSummaryService(db_connection)
    user = session.get('user')
    summary_data = service.get_card_summary(user)
    return jsonify(summary_data)
