import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";
import { sendAMCExpiryAlert } from "@/lib/notifications/notificationService";
import { logOperation } from "@/lib/audit/loggingHelper";
import { verifyToken } from "@/lib/auth/utils";

// Validate bearer token from Authorization header and return the user
async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      response: NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      response: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  const supabase = createServerClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", decoded.userId)
    .single();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  return { user };
}

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
    const { user, response } = await getAuthenticatedUser(req);
    if (!user) return response!;

    // Get user's society
    const { data: userData } = await supabase
      .from("users")
      .select("society_id")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("amcs")
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    // Log AMC creation
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "CREATE",
        entityType: "amc",
        entityId: data.id,
        societyId: userData.society_id,
        userId: user.id,
        newValues: data,
        description: `AMC created: ${validatedData.vendor_name}`,
      });
    }

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "AMC ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { user, response } = await getAuthenticatedUser(req);
    if (!user) return response!;

    // Get user's society
    const { data: userData } = await supabase
      .from("users")
      .select("society_id")
      .eq("id", user.id)
      .single();

    // Get old AMC data
    const { data: oldAmc } = await supabase
      .from("amcs")
      .select("*")
      .eq("id", id)
      .single();

    // Update AMC
    const { data: updatedAmc, error } = await supabase
      .from("amcs")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log AMC update
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "UPDATE",
        entityType: "amc",
        entityId: id,
        societyId: userData.society_id,
        userId: user.id,
        oldValues: oldAmc,
        newValues: updatedAmc,
        description: `AMC updated: ${oldAmc?.vendor_name}`,
      });
    }

    return NextResponse.json(updatedAmc);
  } catch (error) {
    console.error("Error updating AMC:", error);
    return NextResponse.json(
      { error: "Failed to update AMC" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "AMC ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { user, response } = await getAuthenticatedUser(req);
    if (!user) return response!;

    // Get user's society and role
    const { data: userData } = await supabase
      .from("users")
      .select("society_id, role")
      .eq("id", user.id)
      .single();

    // Only admins can delete
    if (userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete AMCs" },
        { status: 403 }
      );
    }

    // Get AMC data before deletion
    const { data: amcData } = await supabase
      .from("amcs")
      .select("*")
      .eq("id", id)
      .single();

    // Delete AMC
    const { error } = await supabase.from("amcs").delete().eq("id", id);

    if (error) throw error;

    // Log AMC deletion
    if (userData?.society_id && amcData) {
      await logOperation({
        request: req,
        action: "DELETE",
        entityType: "amc",
        entityId: id,
        societyId: userData.society_id,
        userId: user.id,
        oldValues: amcData,
        description: `AMC deleted: ${amcData.vendor_name}`,
      });
    }

    return NextResponse.json({ message: "AMC deleted successfully" });
  } catch (error) {
    console.error("Error deleting AMC:", error);
    return NextResponse.json(
      { error: "Failed to delete AMC" },
      { status: 500 }
    );
  }
}
