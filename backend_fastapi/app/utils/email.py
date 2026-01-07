"""
Email utility functions.

This module provides email sending functionality for various
application events like password reset, notifications, etc.
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template

from config import settings


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str = None
):
    """
    Send an email.

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email content
        text_content: Plain text fallback content
    """
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.email_from
    message["To"] = to_email

    # Add text version if provided
    if text_content:
        text_part = MIMEText(text_content, "plain")
        message.attach(text_part)

    # Add HTML version
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)

    # Send email
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True
        )
    except Exception as e:
        print(f"Error sending email: {e}")
        # In production, you might want to log this properly
        pass


async def send_password_reset_email(email: str, name: str, reset_token: str):
    """
    Send password reset email.

    Args:
        email: User's email address
        name: User's name
        reset_token: Password reset token
    """
    reset_link = f"http://localhost:3000/auth/reset-password?token={reset_token}"

    html_template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #4F46E5; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello {{ name }},</p>
            <p>We received a request to reset your password for your Society Management account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="{{ reset_link }}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>{{ reset_link }}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <div class="footer">
                <p>Thanks,<br>Society Management Team</p>
            </div>
        </div>
    </body>
    </html>
    """)

    html_content = html_template.render(name=name, reset_link=reset_link)
    text_content = f"""
    Password Reset Request
    
    Hello {name},
    
    We received a request to reset your password for your Society Management account.
    
    Click this link to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    
    Thanks,
    Society Management Team
    """

    await send_email(
        to_email=email,
        subject="Password Reset Request - Society Management",
        html_content=html_content,
        text_content=text_content
    )


async def send_welcome_email(email: str, name: str):
    """
    Send welcome email to new user.

    Args:
        email: User's email address
        name: User's name
    """
    html_template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Society Management!</h1>
            </div>
            <div class="content">
                <p>Hello {{ name }},</p>
                <p>Thank you for joining Society Management System!</p>
                <p>You can now manage your society activities, track issues, monitor assets, and much more.</p>
                <p>Get started by logging in to your account.</p>
            </div>
            <div class="footer">
                <p>Thanks,<br>Society Management Team</p>
            </div>
        </div>
    </body>
    </html>
    """)

    html_content = html_template.render(name=name)

    await send_email(
        to_email=email,
        subject="Welcome to Society Management!",
        html_content=html_content
    )
