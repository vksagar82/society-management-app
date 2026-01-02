import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { sendAMCExpiryAlert } from "@/lib/notifications/notificationService";

export async function GET(req: NextRequest) {
  try {
    // Verify this is a valid cron request (from Vercel)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get all AMCs expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: amcs, error } = await supabase
      .from("amcs")
      .select(
        `
        *,
        society:societies(*)
      `
      )
      .eq("status", "active")
      .lte("contract_end_date", thirtyDaysFromNow.toISOString().split("T")[0])
      .gte("contract_end_date", new Date().toISOString().split("T")[0]);

    if (error) throw error;

    // For each expiring AMC, get society admins and send alerts
    for (const amc of amcs || []) {
      const { data: admins, error: adminError } = await supabase
        .from("users")
        .select(
          `
          *,
          notification_preferences(*)
        `
        )
        .eq("society_id", amc.society_id)
        .eq("role", "admin");

      if (!adminError && admins) {
        for (const admin of admins) {
          const prefs = admin.notification_preferences?.[0];
          if (prefs && prefs.email_enabled && prefs.email) {
            await sendAMCExpiryAlert(
              prefs.email,
              amc.vendor_name,
              new Date(amc.contract_end_date).toLocaleDateString()
            ).catch(console.error);
          }
        }
      }

      // Create alert record
      await supabase.from("alerts").insert([
        {
          society_id: amc.society_id,
          title: `AMC Expiry Alert - ${amc.vendor_name}`,
          message: `The AMC for ${amc.service_type} from ${
            amc.vendor_name
          } is expiring on ${new Date(
            amc.contract_end_date
          ).toLocaleDateString()}`,
          alert_type: "amc_expiry",
          severity: "warning",
          related_entity_type: "amc",
          related_entity_id: amc.id,
          channels: ["email"],
          delivery_status: "sent",
          sent_at: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      processed: amcs?.length || 0,
    });
  } catch (error) {
    console.error("Error in AMC expiry cron:", error);
    return NextResponse.json(
      { error: "Failed to process cron job" },
      { status: 500 }
    );
  }
}
