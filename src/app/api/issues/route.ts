import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";

const issueSchema = z.object({
  society_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  reported_by: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  location: z.string().optional(),
  images: z.array(z.string()).optional(),
  target_resolution_date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const societyId = req.nextUrl.searchParams.get("society_id");
    const status = req.nextUrl.searchParams.get("status");

    let query = supabase.from("issues").select(`
        *,
        reported_by_user:users!reported_by(full_name, email),
        assigned_to_user:users!assigned_to(full_name, email)
      `);

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
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = issueSchema.parse(body);

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("issues")
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
