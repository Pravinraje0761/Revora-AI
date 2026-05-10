import os
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content

sg = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@yourcompany.com")
FROM_NAME = os.getenv("FROM_NAME", "Revora AI")


def send_retention_email(
    to_email: str,
    to_name: str,
    subject: str,
    body: str,
) -> dict:
    """
    Sends a retention email via SendGrid.
    Returns { success, message_id }
    """
    if not os.getenv("SENDGRID_API_KEY"):
        # Mock behavior
        print(f"MOCK EMAIL SENT TO: {to_email} ({to_name})")
        print(f"SUBJECT: {subject}")
        print(f"BODY: {body[:100]}...")
        return {
            "success": True,
            "status_code": 200,
            "message_id": "mock_id_123",
        }

    html_body = _text_to_html(body)

    message = Mail(
        from_email=Email(FROM_EMAIL, FROM_NAME),
        to_emails=To(to_email, to_name),
        subject=subject,
        html_content=Content("text/html", html_body),
    )

    try:
        response = sg.send(message)
        return {
            "success": True,
            "status_code": response.status_code,
            "message_id": response.headers.get("X-Message-Id", ""),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def _text_to_html(text: str) -> str:
    """Convert plain text email body to clean HTML."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    html_paragraphs = "".join(f"<p>{p}</p>" for p in paragraphs)

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 600px; margin: 0 auto; padding: 40px 20px;
            color: #1a1a1a; line-height: 1.6; font-size: 15px; }}
    p {{ margin: 0 0 16px; }}
    .footer {{ margin-top: 40px; padding-top: 20px;
               border-top: 1px solid #e5e5e5;
               font-size: 12px; color: #888; }}
  </style>
</head>
<body>
  {html_paragraphs}
  <div class="footer">
    <p>Revora AI &mdash; Customer Success Platform<br>
    You're receiving this because you're a valued customer.</p>
  </div>
</body>
</html>
"""
