import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";
import { sendAMCExpiryAlert } from "@/lib/notifications/notificationService";

const amcSchema = z.object({
  society_id: z.string().uuid().optional(),
  vendor_name: z.string().min(1),
  service_type: z.string().min(1),
  contract_start_date: z.string(),
  contract_end_date: z.string(),
  annual_cost: z.number().optional(),
  currency: z.string().default("INR"),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  email: z.string().email().optional(),
  renewal_reminder_days: z.number().default(30),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const societyId = req.nextUrl.searchParams.get("society_id");

    let query = supabase
      .from("amcs")
      .select("*")
      .order("contract_end_date", { ascending: true });

    if (societyId) {
      query = query.eq("society_id", societyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching AMCs:", error);
    return NextResponse.json(
      { error: "Failed to fetch AMCs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = amcSchema.parse(body);

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("amcs")
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    // Check if AMC is already expired or expiring soon
    const endDate = new Date(validatedData.contract_end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If expired or expiring within 30 days, send alert to admins
    if (daysUntilExpiry <= 30 && validatedData.society_id) {
      const { data: admins } = await supabase
        .from("users")
        .select("email")
        .eq("society_id", validatedData.society_id)
        .eq("role", "admin")
        .eq("is_active", true);

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.email) {
            try {
              await sendAMCExpiryAlert(
                admin.email,
                validatedData.vendor_name,
                endDate.toLocaleDateString()
              );
            } catch (emailError) {
              console.error("Failed to send email alert:", emailError);
            }
          }
        }
      }

      // Create alert record
      try {
        await supabase.from("alerts").insert([
          {
            society_id: validatedData.society_id,
            title: `AMC Expiry Alert - ${validatedData.vendor_name}`,
            message: `The AMC for ${validatedData.service_type} from ${
              validatedData.vendor_name
            } is expiring on ${endDate.toLocaleDateString()}. Please renew the contract.`,
            alert_type: "amc_expiry",
            severity: daysUntilExpiry < 0 ? "critical" : "warning",
            related_entity_type: "amc",
            related_entity_id: data.id,
            channels: ["email"],
            delivery_status: "sent",
            sent_at: new Date().toISOString(),
          },
        ]);
      } catch (alertError) {
        console.error("Failed to create alert record:", alertError);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating AMC:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create AMC" },
      { status: 500 }
    );
  }
}
