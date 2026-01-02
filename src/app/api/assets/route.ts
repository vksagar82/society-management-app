import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";

const assetSchema = z.object({
  society_id: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.number().optional(),
  warranty_expiry_date: z.string().optional(),
  amc_id: z.string().uuid().optional().nullable(),
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
  try {
    const supabase = createServerClient();
    const societyId = req.nextUrl.searchParams.get("society_id");
    const category = req.nextUrl.searchParams.get("category");
    const status = req.nextUrl.searchParams.get("status");

    let query = supabase.from("assets").select(`
        *,
        amc:amcs(vendor_name, service_type),
        created_by_user:users!created_by(full_name, email)
      `);

    if (societyId) {
      query = query.eq("society_id", societyId);
    }

    if (category) {
      query = query.eq("category", category);
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
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = assetSchema.parse(body);

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("assets")
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

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
