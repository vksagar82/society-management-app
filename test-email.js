require("dotenv").config({ path: ".env.local" });
const nodemailer = require("nodemailer");

console.log("\n📧 Testing Email Sending via Gmail...\n");

// Validate environment variables
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  console.log("❌ Missing SMTP credentials!");
  console.log("Make sure .env.local has:");
  console.log("   SMTP_HOST=smtp.gmail.com");
  console.log("   SMTP_PORT=587");
  console.log("   SMTP_USER=your_email@gmail.com");
  console.log("   SMTP_PASS=your_app_password");
  process.exit(1);
}

console.log("📋 Configuration:");
console.log(`   Host: ${SMTP_HOST || "smtp.gmail.com"}`);
console.log(`   Port: ${SMTP_PORT || "587"}`);
console.log(`   User: ${SMTP_USER}`);
console.log(`   Pass: ${SMTP_PASS.substring(0, 5)}...`);
console.log("");

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS not SSL
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

// Test email
const testEmail = {
  from: SMTP_USER,
  to: SMTP_USER, // Send to yourself for testing
  subject: "🧪 Society Management - Test Email",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">✅ Email Test Successful!</h2>
        <div style="color: #666; line-height: 1.6;">
          <p>This is a test email from the Society Management System.</p>
          <p>If you received this email, your Gmail SMTP configuration is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Timestamp: ${new Date().toLocaleString()}</li>
            <li>From: ${SMTP_USER}</li>
            <li>Service: Gmail SMTP</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  text: `Society Management System - Email Test
  
This is a test email. If you received this, your Gmail SMTP configuration is working!

Test Details:
- Timestamp: ${new Date().toLocaleString()}
- From: ${SMTP_USER}
- Service: Gmail SMTP`,
};

(async () => {
  try {
    console.log("🔄 Sending test email...");
    const info = await transporter.sendMail(testEmail);

    console.log("\n✅ Email sent successfully!");
    console.log("\n📬 Message Details:");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`   To: ${testEmail.to}`);

    console.log("\n💡 Next steps:");
    console.log("   1. Check your email inbox");
    console.log("   2. If you don't see it, check spam folder");
    console.log("   3. System is ready to send AMC expiry alerts!");
    console.log("");
  } catch (error) {
    console.log("\n❌ Failed to send email!");
    console.log("\n🔍 Error Details:");
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);

    if (error.message.includes("Invalid login")) {
      console.log("\n⚠️  Authentication Failed! Check:");
      console.log("   - Gmail email address is correct");
      console.log("   - App password is correct (not regular password)");
      console.log("   - 2FA is enabled on Gmail account");
      console.log(
        "   - Generate new app password: https://myaccount.google.com/apppasswords"
      );
    } else if (error.message.includes("getaddrinfo")) {
      console.log("\n⚠️  Network Error! Check:");
      console.log("   - Internet connection is working");
      console.log("   - Gmail SMTP server is reachable");
      console.log("   - No firewall blocking port 587");
    }
    console.log("");
    process.exit(1);
  }
})();
