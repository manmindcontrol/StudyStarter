import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";

export const runtime = "nodejs";

const supabase = createServiceRoleClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const lectureId = params.id;

    // First, fetch the lecture to get audio file path and verify ownership
    const { data: lecture, error: fetchError } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .eq("user_id", user.id) // Verify ownership
      .single();

    if (fetchError || !lecture) {
      return NextResponse.json(
        { error: "Lecture not found or access denied" },
        { status: 404 }
      );
    }

    // Step 1: Delete audio file from Supabase Storage (if exists)
    // Note: audio_file_path might not exist in schema yet, but adding for future-proofing
    const audioPath = (lecture as any).audio_file_path;
    if (audioPath) {
      try {
        const { error: storageError } = await supabase.storage
          .from("lecture-recordings")
          .remove([audioPath]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          // Continue anyway - don't block deletion if storage fails
        }
      } catch (storageErr) {
        console.error("Storage deletion exception:", storageErr);
        // Continue anyway
      }
    }

    // Step 2: Delete from database (this will cascade to related records via foreign keys)
    const { error: deleteError } = await supabase
      .from("lectures")
      .delete()
      .eq("id", lectureId)
      .eq("user_id", user.id); // Double-check ownership

    if (deleteError) {
      console.error("Database deletion error:", deleteError);
      return NextResponse.json(
        { error: `Error deleting lecture: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    const msg =
      error instanceof Error ? error.message : "Unexpected delete error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
