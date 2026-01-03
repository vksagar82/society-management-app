import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";
import { logOperation } from "@/lib/audit/loggingHelper";

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

    const { data, error } = await supabase
      .from("issues")
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    // Log issue creation
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "CREATE",
        entityType: "issue",
        entityId: data.id,
        societyId: userData.society_id,
        userId: authData.user.id,
        newValues: data,
        description: `Issue created: ${validatedData.title}`,
      });
    }

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Issue ID is required" },
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

    // Get old issue data
    const { data: oldIssue } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    // Update issue
    const { data: updatedIssue, error } = await supabase
      .from("issues")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log issue update
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "UPDATE",
        entityType: "issue",
        entityId: id,
        societyId: userData.society_id,
        userId: authData.user.id,
        oldValues: oldIssue,
        newValues: updatedIssue,
        description: `Issue updated: ${oldIssue?.title}`,
      });
    }

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
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
        { error: "Issue ID is required" },
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
        { error: "Only admins can delete issues" },
        { status: 403 }
      );
    }

    // Get issue data before deletion
    const { data: issueData } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    // Delete issue
    const { error } = await supabase.from("issues").delete().eq("id", id);

    if (error) throw error;

    // Log issue deletion
    if (userData?.society_id && issueData) {
      await logOperation({
        request: req,
        action: "DELETE",
        entityType: "issue",
        entityId: id,
        societyId: userData.society_id,
        userId: authData.user.id,
        oldValues: issueData,
        description: `Issue deleted: ${issueData.title}`,
      });
    }

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    );
  }
}
