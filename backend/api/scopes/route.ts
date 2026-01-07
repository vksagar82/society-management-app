import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";
import { DEFAULT_ROLE_SCOPES, RoleType } from "@/lib/auth/scopes";
import { logOperation } from "@/lib/audit/loggingHelper";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[API Scopes] Missing or invalid authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      console.error("[API Scopes] Invalid or expired token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get user's role and society
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("global_role")
      .eq("id", decoded.userId)
      .single();

    if (userError) {
      console.error("[API Scopes] Error fetching user:", userError);
    }

    if (!user) {
      console.error(`[API Scopes] User not found with ID: ${decoded.userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.global_role !== "developer") {
      console.error(
        `[API Scopes] User role ${user.global_role} is not developer`
      );
      return NextResponse.json(
        { error: "Only developers can manage scopes" },
        { status: 403 }
      );
    }

    // Get all available scopes
    const { data: roleScopes, error } = await supabase
      .from("role_scopes")
      .select("*")
      .order("role")
      .order("scope_name");

    if (error) {
      console.error("Error fetching scopes:", error);
      return NextResponse.json(
        { error: "Failed to fetch scopes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      scopes: roleScopes,
      defaultScopes: DEFAULT_ROLE_SCOPES,
    });
  } catch (error) {
    console.error("Get scopes error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Verify user is developer
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (!user || user.global_role !== "developer") {
      return NextResponse.json(
        { error: "Only developers can manage scopes" },
        { status: 403 }
      );
    }

    const { societyId, role, scopeName, isEnabled, description } =
      await req.json();

    if (!role || !scopeName) {
      return NextResponse.json(
        { error: "Role and scope name are required" },
        { status: 400 }
      );
    }

    // Insert or update scope
    const { data, error } = await supabase
      .from("role_scopes")
      .upsert({
        society_id: societyId || null,
        role,
        scope_name: scopeName,
        scope_description: description,
        is_enabled: isEnabled !== false,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating scope:", error);
      return NextResponse.json(
        { error: "Failed to create scope" },
        { status: 500 }
      );
    }

    // Log the action
    await logOperation({
      request: req,
      action: "CREATE",
      entityType: "role_scope",
      entityId: data.id,
      societyId: societyId,
      userId: user.id,
      newValues: data,
      description: `Created scope ${scopeName} for role ${role}`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create scope error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Verify user is developer
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (!user || user.global_role !== "developer") {
      return NextResponse.json(
        { error: "Only developers can manage scopes" },
        { status: 403 }
      );
    }

    const { id, isEnabled, description } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Scope ID is required" },
        { status: 400 }
      );
    }

    // Update scope
    const { data, error } = await supabase
      .from("role_scopes")
      .update({
        is_enabled: isEnabled,
        scope_description: description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating scope:", error);
      return NextResponse.json(
        { error: "Failed to update scope" },
        { status: 500 }
      );
    }

    // Log the action
    await logOperation({
      request: req,
      action: "UPDATE",
      entityType: "role_scope",
      entityId: id,
      societyId: data.society_id,
      userId: user.id,
      newValues: data,
      description: `Updated scope ${data.scope_name}`,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update scope error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
