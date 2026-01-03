import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyPassword, generateToken } from "@/lib/auth/utils";
import { logOperation } from "@/lib/audit/loggingHelper";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    // Update last login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    // Log login activity
    if (user.society_id) {
      await logOperation({
        request: req,
        action: "VIEW",
        entityType: "auth_login",
        entityId: user.id,
        societyId: user.society_id,
        userId: user.id,
        newValues: {
          email: user.email,
          login_time: new Date().toISOString(),
        },
        description: `User login: ${email}`,
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data and token
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        society_id: user.society_id,
        flat_no: user.flat_no,
        wing: user.wing,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
