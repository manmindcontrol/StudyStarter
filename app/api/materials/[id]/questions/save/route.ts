import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await context.params;

    // Get user from session - CRITICAL FOR SECURITY
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questions, questionType } = body;

    if (!questions || !questionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user owns the material
    const { data: material } = await supabase
      .from("materials")
      .select("user_id")
      .eq("id", materialId)
      .single();

    if (!material || material.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this material" },
        { status: 403 }
      );
    }

    // Save to DB
    const { data: inserted, error: insertError } = await supabase
      .from("generated_questions")
      .insert({
        material_id: materialId,
        user_id: user.id, // Use authenticated user ID, not from body
        question_type: questionType,
        questions,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save questions." },
        { status: 500 }
      );
    }

    // Increment usage counter AFTER successful save
    try {
      const { incrementUsage } = await import("@/lib/usage");
      await incrementUsage(user.id, 'questions_generations');
    } catch (usageError) {
      console.error("Error incrementing usage:", usageError);
      // Don't fail the request if usage increment fails
    }

    return NextResponse.json({
      success: true,
      record: inserted,
    });
  } catch (error) {
    console.error("Save Questions Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
