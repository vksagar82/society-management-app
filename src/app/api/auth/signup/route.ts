import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { hashPassword, generateToken } from "@/lib/auth/utils";
import { logOperation } from "@/lib/audit/loggingHelper";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone, societyId } = await req.json();

    if (!email || !password || !fullName || !phone || !societyId) {
      return NextResponse.json(
        { error: "All fields are required" },
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

    // Create new user with 'member' role by default
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash: passwordHash,
          full_name: fullName,
          phone,
          society_id: societyId,
          role: "member",
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

    // Log user signup
    await logOperation({
      request: req,
      action: "CREATE",
      entityType: "user",
      entityId: newUser.id,
      societyId: societyId,
      userId: newUser.id,
      newValues: {
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role,
        status: "active",
      },
      description: `New user signup: ${email}`,
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
          role: newUser.role,
          society_id: newUser.society_id,
          flat_no: newUser.flat_no,
          wing: newUser.wing,
          avatar_url: newUser.avatar_url,
          is_active: newUser.is_active,
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
