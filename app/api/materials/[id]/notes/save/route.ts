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
    const body = await request.json();
    const { summary, keyPoints, concepts, studyTips, userId } = body;

    if (!summary || !keyPoints || !concepts || !studyTips || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to DB
    const { data: inserted, error: insertError } = await supabase
      .from("study_notes")
      .insert({
        material_id: materialId,
        user_id: userId,
        summary,
        key_points: keyPoints,
        concepts,
        study_tips: studyTips,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save notes." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: inserted,
    });
  } catch (error) {
    console.error("Save Notes Error:", error);
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
