# routes/card_summary_routes.py
from flask import Blueprint, render_template, jsonify, session
from service.card_summary_service import CardSummaryService
from msys.database import get_db_connection
from flask_login import login_required
from routes.admin_routes import log_menu_access
from routes.auth_routes import card_summary_required

card_summary_bp = Blueprint('card_summary', __name__)

@card_summary_bp.route('/card_summary')
@login_required
@log_menu_access
def card_summary_page():
    """
    Renders the card summary page.
    """
    return render_template('card_summary.html')
