# Gmail Email Setup Guide

## Email Testing

We've created a test script to verify your Gmail SMTP configuration is working correctly.

### Step 1: Generate Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com)
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Go back to Security and find **App passwords**
5. Select **Mail** and **Windows Computer**
6. Google will generate a 16-character password (e.g., `buxp yzvi riqv mrpq`)
7. Copy this password **without spaces** to your `.env.local` file

### Step 2: Update .env.local

```dotenv
# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_password_without_spaces
```

### Step 3: Test Email Sending

Run the test script:

```bash
node test-email.js
```

**Expected Output:**

```
✅ Email sent successfully!
📬 Message Details:
   Message ID: <message-id>
   Response: 250 2.0.0 OK...
   To: your_email@gmail.com
```

### Step 4: Check Your Email

1. Check your **Gmail inbox** for the test email
2. If not found, check **Spam** folder
3. If still missing, check the error message from the test script

## Troubleshooting

### Error: "Invalid login"

- ✅ Verify you're using an **App Password**, not your regular Gmail password
- ✅ Make sure 2FA is enabled on your Google account
- ✅ Generate a new app password: https://myaccount.google.com/apppasswords

### Error: "ESOCKET" or "self-signed certificate"

- ✅ Check your internet connection
- ✅ Verify Gmail SMTP is reachable (port 587)
- ✅ No firewall blocking SMTP port

### No Email Received

- ✅ Check spam/junk folder
- ✅ Verify email address in `.env.local` is correct
- ✅ Check Gmail account isn't compromised (Google sends security alert)

## How Alerts Work

Once email is configured, the system will:

1. **When creating an AMC with expired date:**

   - Automatically detects expiration
   - Sends Gmail alert to all society admins
   - Creates alert record in database

2. **Scheduled checks (optional):**
   - Visit `/test-cron` to manually trigger checks
   - Or set up Vercel Cron Jobs in `vercel.json`

## Email Alerts Sent For

- 📬 **AMC Expiry** - When contract is expired or expiring within 30 days
- 📬 **Issue Updates** - When issue status changes
- 📬 **Asset Maintenance** - When maintenance is scheduled

## Next Steps

1. ✅ Run `node test-email.js` to verify configuration
2. ✅ Create test AMC with expired date to trigger alert
3. ✅ Confirm email is received
4. ✅ System is ready for production!
