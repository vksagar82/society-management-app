import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { sendAssetMaintenanceAlert } from "@/lib/notifications/notificationService";

export async function GET(req: NextRequest) {
  try {
    // Verify this is a valid cron request (from Vercel)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get all assets with upcoming maintenance
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: assets, error } = await supabase
      .from("assets")
      .select(
        `
        *,
        society:societies(*)
      `
      )
      .eq("status", "active")
      .lte("next_maintenance_date", tomorrow.toISOString().split("T")[0])
      .gte("next_maintenance_date", new Date().toISOString().split("T")[0]);

    if (error) throw error;

    // For each asset with upcoming maintenance, get society managers and send alerts
    for (const asset of assets || []) {
      const { data: managers, error: managerError } = await supabase
        .from("users")
        .select(
          `
          *,
          notification_preferences(*)
        `
        )
        .eq("society_id", asset.society_id)
        .in("role", ["admin", "manager"]);

      if (!managerError && managers) {
        for (const manager of managers) {
          const prefs = manager.notification_preferences?.[0];
          if (prefs && prefs.email_enabled && prefs.email) {
            await sendAssetMaintenanceAlert(
              prefs.email,
              asset.name,
              new Date(asset.next_maintenance_date).toLocaleDateString()
            ).catch(console.error);
          }
        }
      }

      // Create alert record
      await supabase.from("alerts").insert([
        {
          society_id: asset.society_id,
          title: `Asset Maintenance Scheduled - ${asset.name}`,
          message: `Maintenance scheduled for ${asset.name} on ${new Date(
            asset.next_maintenance_date
          ).toLocaleDateString()}. Location: ${asset.location}`,
          alert_type: "asset_maintenance",
          severity: "info",
          related_entity_type: "asset",
          related_entity_id: asset.id,
          channels: ["email"],
          delivery_status: "sent",
          sent_at: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      processed: assets?.length || 0,
    });
  } catch (error) {
    console.error("Error in asset maintenance cron:", error);
    return NextResponse.json(
      { error: "Failed to process cron job" },
      { status: 500 }
    );
  }
}
