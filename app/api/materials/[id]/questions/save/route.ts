import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Resolves the caller from the Authorization header.
// Returns either the user or a ready-to-send error response.
async function authenticate(
  request: NextRequest
): Promise<{ error: NextResponse } | { user: { id: string } }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      ),
    };
  }

  return { user };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await context.params;

    const auth = await authenticate(request);
    if ("error" in auth) return auth.error;
    const { user } = auth;

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

/**
 * Updates the questions of an already-saved record (manual edits).
 * Does NOT touch the usage counter — editing is not a new generation.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await context.params;

    const auth = await authenticate(request);
    if ("error" in auth) return auth.error;
    const { user } = auth;

    const body = await request.json();
    const { recordId, questions } = body;

    if (!recordId || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "A test must contain at least one question." },
        { status: 400 }
      );
    }

    // Verify the record exists, belongs to this user AND to this material
    const { data: existing } = await supabase
      .from("generated_questions")
      .select("id, user_id, material_id")
      .eq("id", recordId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to these questions" },
        { status: 403 }
      );
    }

    if (existing.material_id !== materialId) {
      return NextResponse.json(
        { error: "Question record does not belong to this material" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("generated_questions")
      .update({ questions })
      .eq("id", recordId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update questions." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: updated,
    });
  } catch (error) {
    console.error("Update Questions Error:", error);
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
