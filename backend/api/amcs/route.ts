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
    .select(
      `
      *,
      user_societies!inner(society_id, role, is_primary)
    `
    )
    .eq("id", decoded.userId)
    .eq("user_societies.is_primary", true)
    .single();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  // Attach primary society info to user object for backward compatibility
  const primarySociety = user.user_societies?.[0];
  user.society_id = primarySociety?.society_id;
  user.role = primarySociety?.role;

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
  asset_ids: z
    .array(z.string().uuid())
    .min(1, "At least one asset is required"),
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

    const amcList = data || [];

    if (amcList.length === 0) {
      return NextResponse.json(amcList);
    }

    const amcIds = amcList.map((amc) => amc.id);
    const { data: amcAssets, error: amcAssetsError } = await supabase
      .from("amc_assets")
      .select("amc_id, asset:assets(id, name, asset_code, location)")
      .in("amc_id", amcIds);

    if (amcAssetsError) throw amcAssetsError;

    const assetsByAmc = new Map<string, any[]>();
    (amcAssets || []).forEach((row) => {
      if (!row.amc_id || !row.asset) return;
      const list = assetsByAmc.get(row.amc_id) || [];
      list.push(row.asset);
      assetsByAmc.set(row.amc_id, list);
    });

    const withAssets = amcList.map((amc) => ({
      ...amc,
      assets: assetsByAmc.get(amc.id) || [],
    }));

    return NextResponse.json(withAssets);
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
    const { asset_ids, ...amcData } = validatedData;

    const supabase = createServerClient();
    const { user, response } = await getAuthenticatedUser(req);
    if (!user) return response!;

    // Get user's society
    const { data: userData } = await supabase
      .from("users")
      .select("society_id")
      .eq("id", user.id)
      .single();

    const societyId = userData?.society_id || amcData.society_id;

    if (!societyId) {
      return NextResponse.json(
        { error: "No society found for user" },
        { status: 400 }
      );
    }

    const { data: assetsForAmc, error: assetsError } = await supabase
      .from("assets")
      .select("id, society_id")
      .in("id", asset_ids);

    if (assetsError) throw assetsError;

    if (!assetsForAmc || assetsForAmc.length !== asset_ids.length) {
      return NextResponse.json(
        { error: "One or more assets not found" },
        { status: 400 }
      );
    }

    const invalidAsset = assetsForAmc.find(
      (asset) => asset.society_id !== societyId
    );

    if (invalidAsset) {
      return NextResponse.json(
        { error: "All assets must belong to the same society" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("amcs")
      .insert([{ ...amcData, society_id: societyId }])
      .select()
      .single();

    if (error) throw error;

    const amcAssetRows = asset_ids.map((assetId) => ({
      amc_id: data.id,
      asset_id: assetId,
    }));

    const { error: linkError } = await supabase
      .from("amc_assets")
      .insert(amcAssetRows);

    if (linkError) throw linkError;

    // Log AMC creation
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "CREATE",
        entityType: "amc",
        entityId: data.id,
        societyId,
        userId: user.id,
        newValues: { ...data, asset_ids },
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
    if (daysUntilExpiry <= 30 && societyId) {
      const { data: admins } = await supabase
        .from("users")
        .select("email")
        .eq("society_id", societyId)
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
            society_id: societyId,
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
    const updateSchema = amcSchema.extend({
      id: z.string().uuid(),
    });

    const parsed = updateSchema.parse(body);
    const { id, asset_ids, ...updateData } = parsed;

    const supabase = createServerClient();
    const { user, response } = await getAuthenticatedUser(req);
    if (!user) return response!;

    // Get user's society
    const { data: userData } = await supabase
      .from("users")
      .select("society_id")
      .eq("id", user.id)
      .single();

    const societyId = userData?.society_id || updateData.society_id;

    if (!societyId) {
      return NextResponse.json(
        { error: "No society found for user" },
        { status: 400 }
      );
    }

    // Get old AMC data
    const { data: oldAmc } = await supabase
      .from("amcs")
      .select("*")
      .eq("id", id)
      .single();

    const { data: assetsForAmc, error: assetsError } = await supabase
      .from("assets")
      .select("id, society_id")
      .in("id", asset_ids);

    if (assetsError) throw assetsError;

    if (!assetsForAmc || assetsForAmc.length !== asset_ids.length) {
      return NextResponse.json(
        { error: "One or more assets not found" },
        { status: 400 }
      );
    }

    const invalidAsset = assetsForAmc.find(
      (asset) => asset.society_id !== societyId
    );

    if (invalidAsset) {
      return NextResponse.json(
        { error: "All assets must belong to the same society" },
        { status: 400 }
      );
    }

    // Update AMC
    const { data: updatedAmc, error } = await supabase
      .from("amcs")
      .update({
        ...updateData,
        society_id: societyId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Replace asset links
    const { error: deleteLinksError } = await supabase
      .from("amc_assets")
      .delete()
      .eq("amc_id", id);

    if (deleteLinksError) throw deleteLinksError;

    const amcAssetRows = asset_ids.map((assetId) => ({
      amc_id: id,
      asset_id: assetId,
    }));

    const { error: linkError } = await supabase
      .from("amc_assets")
      .insert(amcAssetRows);

    if (linkError) throw linkError;

    // Log AMC update
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "UPDATE",
        entityType: "amc",
        entityId: id,
        societyId,
        userId: user.id,
        oldValues: oldAmc,
        newValues: { ...updatedAmc, asset_ids },
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
