import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { hashPassword, generateToken } from "@/lib/auth/utils";
import { logOperation } from "@/lib/audit/loggingHelper";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone, societyIds } = await req.json();

    if (
      !email ||
      !password ||
      !fullName ||
      !phone ||
      !societyIds ||
      !Array.isArray(societyIds) ||
      societyIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "All fields are required and at least one society must be selected",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create new user with 'member' global_role by default
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash: passwordHash,
          full_name: fullName,
          phone,
          global_role: "member",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Signup error:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Add user to all selected societies with pending approval status
    const societyMappings = societyIds.map(
      (societyId: string, index: number) => ({
        user_id: newUser.id,
        society_id: societyId,
        role: "member",
        is_primary: index === 0, // First society is primary
        approval_status: "pending",
      })
    );

    const { error: societyError } = await supabase
      .from("user_societies")
      .insert(societyMappings);

    if (societyError) {
      console.error("Society mapping error:", societyError);
      // Delete the user if society mapping fails
      await supabase.from("users").delete().eq("id", newUser.id);
      return NextResponse.json(
        { error: "Failed to add user to societies" },
        { status: 500 }
      );
    }

    // Log user signup
    await logOperation({
      request: req,
      action: "CREATE",
      entityType: "user",
      entityId: newUser.id,
      societyId: societyIds[0],
      userId: newUser.id,
      newValues: {
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        global_role: newUser.global_role,
        societies: societyIds.length,
        status: "pending_approval",
      },
      description: `New user signup: ${email} - Pending approval for ${societyIds.length} society(ies)`,
    });

    // Generate token
    const token = generateToken(newUser.id);

    return NextResponse.json(
      {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          phone: newUser.phone,
          global_role: newUser.global_role,
          avatar_url: newUser.avatar_url,
          is_active: newUser.is_active,
          pending_approval: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
