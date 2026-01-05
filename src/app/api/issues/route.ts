import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";
import { logOperation } from "@/lib/audit/loggingHelper";
import { verifyToken } from "@/lib/auth/utils";

type EffectiveRole = "developer" | "admin" | "manager" | "member";

async function getRequestUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, global_role, role")
    .eq("id", decoded.userId)
    .single();

  const { data: primarySociety } = await supabase
    .from("user_societies")
    .select("society_id, role")
    .eq("user_id", decoded.userId)
    .eq("is_primary", true)
    .single();

  const effectiveRole =
    (user?.global_role as EffectiveRole | null) ||
    (user?.role as EffectiveRole | null) ||
    (primarySociety?.role as EffectiveRole | null) ||
    "member";

  return {
    supabase,
    userId: decoded.userId,
    effectiveRole,
    societyId: primarySociety?.society_id || null,
  };
}

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
    const auth = await getRequestUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, userId, effectiveRole } = auth;
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

    // Members can only see their own reported issues
    if (effectiveRole === "member") {
      query = query.eq("reported_by", userId);
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
    const auth = await getRequestUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, userId, societyId } = auth;
    const body = await req.json();
    const validatedData = issueSchema.parse(body);

    const { data, error } = await supabase
      .from("issues")
      .insert([
        {
          ...validatedData,
          // Ensure ownership is stamped server-side
          reported_by: validatedData.reported_by || userId,
          society_id: validatedData.society_id || societyId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (societyId) {
      await logOperation({
        request: req,
        action: "CREATE",
        entityType: "issue",
        entityId: data.id,
        societyId,
        userId,
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
    const auth = await getRequestUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, userId, effectiveRole, societyId } = auth;
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
    }

    const { data: oldIssue } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const isOwner = oldIssue.reported_by === userId;
    const canEdit =
      effectiveRole === "developer" ||
      effectiveRole === "admin" ||
      effectiveRole === "manager" ||
      isOwner;

    if (!canEdit) {
      return NextResponse.json(
        { error: "Not authorized to update this issue" },
        { status: 403 }
      );
    }

    const { data: updatedIssue, error } = await supabase
      .from("issues")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (societyId) {
      await logOperation({
        request: req,
        action: "UPDATE",
        entityType: "issue",
        entityId: id,
        societyId,
        userId,
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
    const auth = await getRequestUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, userId, effectiveRole, societyId } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
    }

    const { data: issueData } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (!issueData) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const isOwner = issueData.reported_by === userId;
    const canDelete =
      effectiveRole === "developer" ||
      effectiveRole === "admin" ||
      effectiveRole === "manager" ||
      isOwner;

    if (!canDelete) {
      return NextResponse.json(
        { error: "Not authorized to delete this issue" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("issues").delete().eq("id", id);

    if (error) throw error;

    if (societyId && issueData) {
      await logOperation({
        request: req,
        action: "DELETE",
        entityType: "issue",
        entityId: id,
        societyId,
        userId,
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
