import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import {
  sendEmailNotification,
  formatAlertMessage,
} from "@/lib/notifications/notificationService";
import { z } from "zod";

const alertSchema = z.object({
  society_id: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().min(1),
  alert_type: z.string(),
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  related_entity_type: z.string().optional(),
  related_entity_id: z.string().uuid().optional(),
  recipients: z.array(z.string()).optional(),
  channels: z.array(z.enum(["email"])),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const societyId = req.nextUrl.searchParams.get("society_id");
    const status = req.nextUrl.searchParams.get("status");

    let query = supabase.from("alerts").select("*");

    if (societyId) {
      query = query.eq("society_id", societyId);
    }

    if (status) {
      query = query.eq("delivery_status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = alertSchema.parse(body);

    const supabase = createServerClient();

    // Get notification preferences for recipients
    let preferences = [];
    if (validatedData.recipients && validatedData.recipients.length > 0) {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .in("user_id", validatedData.recipients);

      if (!error && data) {
        preferences = data;
      }
    }

    // Create alert record
    const { data: alertData, error: alertError } = await supabase
      .from("alerts")
      .insert([
        {
          ...validatedData,
          delivery_status: "pending",
        },
      ])
      .select()
      .single();

    if (alertError) throw alertError;

    // Send notifications via email
    const notificationPayload = {
      title: validatedData.title,
      message: validatedData.message,
      alertType: validatedData.alert_type,
      severity: validatedData.severity as "info" | "warning" | "critical",
    };

    const formattedMessage = formatAlertMessage(notificationPayload);

    for (const pref of preferences) {
      if (
        validatedData.channels.includes("email") &&
        pref.email_enabled &&
        pref.email
      ) {
        await sendEmailNotification(
          pref.email,
          validatedData.title,
          formattedMessage
        ).catch(console.error);
      }
    }

    // Update alert delivery status
    await supabase
      .from("alerts")
      .update({ delivery_status: "sent", sent_at: new Date().toISOString() })
      .eq("id", alertData.id);

    return NextResponse.json(alertData, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
