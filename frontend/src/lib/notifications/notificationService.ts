import nodemailer from "nodemailer";

interface NotificationPayload {
  title: string;
  message: string;
  alertType: string;
  severity?: "info" | "warning" | "critical";
}

// Create Gmail transporter
const getEmailTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS not SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Email Service
export const sendEmailNotification = async (
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            <div style="color: #666; line-height: 1.6;">
              ${message.split("\n").join("<br/>")}
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated message from Society Management System. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: message,
    });

    console.log(`✅ Email sent to ${email}: ${subject}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

// Format alert message for email
export const formatAlertMessage = (payload: NotificationPayload): string => {
  const severityLabel = {
    info: "Info",
    warning: "Warning",
    critical: "Critical",
  };

  const label = severityLabel[payload.severity || "info"];

  return `Subject: ${payload.title}\n\nSeverity: ${label}\nType: ${payload.alertType}\n\n${payload.message}`;
};

// Send notification via email
export const sendNotification = async (
  email: string,
  payload: NotificationPayload
): Promise<{ email: boolean }> => {
  const results = {
    email: false,
  };

  const message = formatAlertMessage(payload);

  results.email = await sendEmailNotification(email, payload.title, message);

  return results;
};

// Send AMC expiry alert
export const sendAMCExpiryAlert = async (
  email: string,
  vendorName: string,
  expiryDate: string
): Promise<{ email: boolean }> => {
  const payload: NotificationPayload = {
    title: "AMC Expiry Alert",
    message: `The AMC for ${vendorName} is expiring on ${expiryDate}. Please renew the contract in time.`,
    alertType: "amc_expiry",
    severity: "warning",
  };

  return sendNotification(email, payload);
};

// Send issue update alert
export const sendIssueUpdateAlert = async (
  email: string,
  issueTitle: string,
  status: string
): Promise<{ email: boolean }> => {
  const payload: NotificationPayload = {
    title: "Issue Update",
    message: `Issue: ${issueTitle}\nStatus: ${status}\n\nPlease check the app for more details.`,
    alertType: "issue_update",
    severity: "info",
  };

  return sendNotification(email, payload);
};

// Send asset maintenance alert
export const sendAssetMaintenanceAlert = async (
  email: string,
  assetName: string,
  maintenanceDate: string
): Promise<{ email: boolean }> => {
  const payload: NotificationPayload = {
    title: "Asset Maintenance Scheduled",
    message: `Asset: ${assetName}\nScheduled Maintenance: ${maintenanceDate}\n\nPlease ensure accessibility.`,
    alertType: "asset_maintenance",
    severity: "info",
  };

  return sendNotification(email, payload);
};
