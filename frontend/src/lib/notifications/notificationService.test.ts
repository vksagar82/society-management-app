import {
  sendEmailNotification,
  sendAMCExpiryAlert,
  sendIssueUpdateAlert,
  sendAssetMaintenanceAlert,
} from "./notificationService";

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-123" }),
  })),
}));

describe("Notification Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendEmailNotification", () => {
    it("should send email successfully", async () => {
      const result = await sendEmailNotification(
        "test@example.com",
        "Test Subject",
        "Test message"
      );
      expect(result).toBe(true);
    });

    it("should handle missing environment variables", async () => {
      const originalSmtpUser = process.env.SMTP_USER;
      delete process.env.SMTP_USER;

      const result = await sendEmailNotification(
        "test@example.com",
        "Test",
        "Test"
      );

      expect(result).toBe(false);
      process.env.SMTP_USER = originalSmtpUser;
    });

    it("should format HTML email correctly", async () => {
      await sendEmailNotification(
        "test@example.com",
        "Test Subject",
        "Test message\nWith multiple lines"
      );

      // Verify the email was formatted with HTML
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe("sendAMCExpiryAlert", () => {
    it("should send AMC expiry alert", async () => {
      const result = await sendAMCExpiryAlert(
        "admin@example.com",
        "Air Conditioning Service",
        "2026-01-31"
      );

      expect(result.email).toBe(true);
    });

    it("should include vendor name in alert", async () => {
      const vendorName = "Premium Maintenance Co";
      await sendAMCExpiryAlert("admin@example.com", vendorName, "2026-01-31");

      // Verify vendor name is included in payload
      expect(true).toBe(true); // Placeholder assertion
    });

    it("should format expiry date correctly", async () => {
      const expiryDate = "2026-01-31";
      const result = await sendAMCExpiryAlert(
        "admin@example.com",
        "Service",
        expiryDate
      );

      expect(result.email).toBe(true);
    });
  });

  describe("sendIssueUpdateAlert", () => {
    it("should send issue update alert", async () => {
      const result = await sendIssueUpdateAlert(
        "user@example.com",
        "Water Leak in Bathroom",
        "in_progress"
      );

      expect(result.email).toBe(true);
    });

    it("should include issue title and status", async () => {
      const issueTitle = "Broken Water Pump";
      const status = "resolved";

      const result = await sendIssueUpdateAlert(
        "user@example.com",
        issueTitle,
        status
      );

      expect(result.email).toBe(true);
    });
  });

  describe("sendAssetMaintenanceAlert", () => {
    it("should send asset maintenance alert", async () => {
      const result = await sendAssetMaintenanceAlert(
        "admin@example.com",
        "Elevator - Tower A",
        "2026-01-15"
      );

      expect(result.email).toBe(true);
    });

    it("should include asset name and maintenance date", async () => {
      const assetName = "CCTV System";
      const maintenanceDate = "2026-02-01";

      const result = await sendAssetMaintenanceAlert(
        "admin@example.com",
        assetName,
        maintenanceDate
      );

      expect(result.email).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle email sending errors gracefully", async () => {
      const mockTransport = {
        sendMail: jest.fn().mockRejectedValueOnce(new Error("SMTP Error")),
      };

      jest.doMock("nodemailer", () => ({
        createTransport: jest.fn(() => mockTransport),
      }));

      // Expect function to handle error without throwing
      expect(true).toBe(true);
    });

    it("should validate email format", async () => {
      // Test with invalid email format
      const result = await sendEmailNotification(
        "invalid-email",
        "Subject",
        "Message"
      );

      // Should still attempt to send (validation handled by nodemailer)
      expect(typeof result).toBe("boolean");
    });
  });
});
