import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";
import { logOperation } from "@/lib/audit/loggingHelper";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const supabase = createServerClient();

    // Check if user is authenticated
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);

      if (decoded) {
        // Check if requester is developer
        const { data: requester } = await supabase
          .from("users")
          .select("global_role")
          .eq("id", decoded.userId)
          .single();

        // Developers get full access
        if (requester?.global_role === "developer") {
          const { data: societies, error } = await supabase
            .from("societies")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }

          return NextResponse.json(societies || []);
        }
      }
    }

    // For unauthenticated users (signup page), return basic society list
    const { data: societies, error } = await supabase
      .from("societies")
      .select("id, name, city, state")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(societies || []);
  } catch (error) {
    console.error("Error fetching societies:", error);
    return NextResponse.json(
      { error: "Failed to fetch societies" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Check if requester is developer
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("global_role")
      .eq("id", decoded.userId)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    // Only developers can create societies
    if (requester.global_role !== "developer") {
      return NextResponse.json(
        { error: "Only developers can create societies" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      address,
      city,
      state,
      pincode,
      contact_person,
      contact_email,
      contact_phone,
    } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    // Create new society
    const { data: newSociety, error } = await supabase
      .from("societies")
      .insert([
        {
          name,
          address,
          city,
          state,
          pincode,
          contact_person,
          contact_email,
          contact_phone,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log society creation
    await logOperation({
      request: req,
      action: "CREATE",
      entityType: "society",
      entityId: newSociety.id,
      societyId: newSociety.id,
      userId: decoded.userId,
      newValues: newSociety,
      description: `Society created: ${name}`,
    });

    return NextResponse.json(newSociety, { status: 201 });
  } catch (error) {
    console.error("Error creating society:", error);
    return NextResponse.json(
      { error: "Failed to create society" },
      { status: 500 }
    );
  }
}
