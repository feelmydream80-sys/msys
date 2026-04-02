from flask import Flask, request, jsonify
from alert_mail import send_alert_email

app = Flask(__name__)

@app.route('/send-alert', methods=['POST'])
def send_alert():
    data = request.get_json() if request.is_json else request.form.to_dict()

    to_emails = data.get('to_emails')      # textarea 값
    subject   = data.get('subject')
    html_body = data.get('html_body') or data.get('body')

    success = send_alert_email(
        to_emails=to_emails,
        subject=subject,
        html_body=html_body
    )

    if success:
        return jsonify({"success": True, "message": "메일 전송 완료"})
    else:
    return jsonify({"success": False, "message": "메일 전송 실패"}), 500