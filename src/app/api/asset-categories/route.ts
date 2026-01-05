import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";
import { logOperation } from "@/lib/audit/loggingHelper";

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

function authenticate(req: NextRequest) {
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

  return { userId: decoded.userId };
}

export async function GET(req: NextRequest) {
  try {
    const authResult = authenticate(req);
    if ("response" in authResult) return authResult.response;
    const requesterId = authResult.userId;

    const supabase = createServerClient();

    const { data: userData } = await supabase
      .from("users")
      .select("society_id")
      .eq("id", requesterId)
      .single();

    if (!userData?.society_id) {
      return NextResponse.json(
        { error: "No society found for user" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("asset_categories")
      .select("id, name, description, created_at")
      .eq("society_id", userData.society_id)
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching asset categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = authenticate(req);
    if ("response" in authResult) return authResult.response;
    const requesterId = authResult.userId;

    const body = await req.json();
    const validated = categorySchema.parse(body);

    const supabase = createServerClient();

    const { data: userData } = await supabase
      .from("users")
      .select("society_id, role")
      .eq("id", requesterId)
      .single();

    if (!userData?.society_id) {
      return NextResponse.json(
        { error: "No society found for user" },
        { status: 404 }
      );
    }

    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manage categories" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("asset_categories")
      .insert([
        {
          name: validated.name,
          description: validated.description,
          society_id: userData.society_id,
          created_by: requesterId,
        },
      ])
      .select("id, name, description, created_at")
      .single();

    if (error) throw error;

    await logOperation({
      request: req,
      action: "CREATE",
      entityType: "asset_category",
      entityId: data.id,
      societyId: userData.society_id,
      userId: requesterId,
      newValues: data,
      description: `Asset category created: ${validated.name}`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating asset category:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create asset category" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = authenticate(req);
    if ("response" in authResult) return authResult.response;
    const requesterId = authResult.userId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: userData } = await supabase
      .from("users")
      .select("society_id, role")
      .eq("id", requesterId)
      .single();

    if (!userData?.society_id) {
      return NextResponse.json(
        { error: "No society found for user" },
        { status: 404 }
      );
    }

    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete categories" },
        { status: 403 }
      );
    }

    const { data: existing } = await supabase
      .from("asset_categories")
      .select("id, name")
      .eq("id", id)
      .eq("society_id", userData.society_id)
      .single();

    const { error } = await supabase
      .from("asset_categories")
      .delete()
      .eq("id", id)
      .eq("society_id", userData.society_id);

    if (error) throw error;

    if (existing) {
      await logOperation({
        request: req,
        action: "DELETE",
        entityType: "asset_category",
        entityId: id,
        societyId: userData.society_id,
        userId: requesterId,
        oldValues: existing,
        description: `Asset category deleted: ${existing.name}`,
      });
    }

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting asset category:", error);
    return NextResponse.json(
      { error: "Failed to delete asset category" },
      { status: 500 }
    );
  }
}
