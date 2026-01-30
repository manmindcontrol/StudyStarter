import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

export const runtime = "nodejs";

const supabase = createServiceRoleClient();

export async function POST(request: NextRequest) {
  try {
    // Get user from session
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

    const userId = user.id;

    // Check usage limits BEFORE saving
    const { allowed, reason, current, limit } = await checkUsageLimit(userId, 'lectures');

    if (!allowed) {
      return NextResponse.json(
        {
          error: reason || 'Usage limit exceeded',
          current,
          limit,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, transcript, duration, audio_file_path } = body;

    if (!transcript || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate transcript is not empty
    if (transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript cannot be empty" },
        { status: 400 }
      );
    }

    // Save to DB
    const lectureData: any = {
      user_id: userId,
      title,
      transcript,
      duration: duration || 0,
    };

    // Add audio_file_path if provided
    if (audio_file_path) {
      lectureData.audio_file_path = audio_file_path;
    }

    const { data: lecture, error: dbError } = await supabase
      .from("lectures")
      .insert(lectureData)
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: `Error saving lecture: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Increment usage counter AFTER successful save
    try {
      await incrementUsage(userId, 'lectures');
    } catch (usageError) {
      console.error("Error incrementing usage:", usageError);
      // Don't fail the request if usage increment fails
    }

    return NextResponse.json({
      success: true,
      lecture,
    });
  } catch (error) {
    console.error("Save lecture error:", error);
    const msg =
      error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
