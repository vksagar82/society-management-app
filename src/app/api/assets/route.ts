import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";
import { logOperation } from "@/lib/audit/loggingHelper";
import { logApiRequest } from "@/lib/middleware/apiLogger";

const assetSchema = z.object({
  society_id: z.string().uuid().optional(),
  name: z.string().min(1),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.number().optional(),
  warranty_expiry_date: z.string().optional(),
  location: z.string().optional(),
  asset_code: z.string().optional(),
  status: z
    .enum(["active", "inactive", "maintenance", "decommissioned"])
    .default("active"),
  last_maintenance_date: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  maintenance_frequency: z.string().optional(),
  notes: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let societyId: string | null = null;
  let statusCode = 200;

  try {
    const supabase = createServerClient();
    societyId = req.nextUrl.searchParams.get("society_id");
    const status = req.nextUrl.searchParams.get("status");

    let query = supabase
      .from("assets")
      .select(`*, created_by_user:users!created_by(full_name, email)`);

    if (societyId) {
      query = query.eq("society_id", societyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching assets:", error);
    statusCode = 500;
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  } finally {
    const responseTime = Date.now() - startTime;
    logApiRequest(req, societyId, null, statusCode, responseTime).catch(
      console.error
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = assetSchema.parse(body);

    const supabase = createServerClient();

    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's primary society from user_societies
    const { data: userData } = await supabase
      .from("user_societies")
      .select("society_id")
      .eq("user_id", authData.user.id)
      .eq("is_primary", true)
      .single();

    const { data, error } = await supabase
      .from("assets")
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    // Log asset creation
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "CREATE",
        entityType: "asset",
        entityId: data.id,
        societyId: userData.society_id,
        userId: authData.user.id,
        newValues: data,
        description: `Asset created: ${validatedData.name}`,
      });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating asset:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create asset" },
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
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's society
    const { data: userData } = await supabase
      .from("users")
      .select("society_id")
      .eq("id", authData.user.id)
      .single();

    // Get old asset data
    const { data: oldAsset } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    // Update asset
    const { data: updatedAsset, error } = await supabase
      .from("assets")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log asset update
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "UPDATE",
        entityType: "asset",
        entityId: id,
        societyId: userData.society_id,
        userId: authData.user.id,
        oldValues: oldAsset,
        newValues: updatedAsset,
        description: `Asset updated: ${oldAsset?.name}`,
      });
    }

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
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
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's society and role
    const { data: userData } = await supabase
      .from("users")
      .select("society_id, role")
      .eq("id", authData.user.id)
      .single();

    // Only admins can delete
    if (userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete assets" },
        { status: 403 }
      );
    }

    // Get asset data before deletion
    const { data: assetData } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    // Delete asset
    const { error } = await supabase.from("assets").delete().eq("id", id);

    if (error) throw error;

    // Log asset deletion
    if (userData?.society_id && assetData) {
      await logOperation({
        request: req,
        action: "DELETE",
        entityType: "asset",
        entityId: id,
        societyId: userData.society_id,
        userId: authData.user.id,
        oldValues: assetData,
        description: `Asset deleted: ${assetData.name}`,
      });
    }

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
