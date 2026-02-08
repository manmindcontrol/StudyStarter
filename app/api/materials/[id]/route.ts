import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";
import OpenAI from "openai";

export const runtime = "nodejs";

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

const supabase = createServiceRoleClient();

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const materialId = id;

    // First, fetch the material to get file paths and verify ownership
    const { data: material, error: fetchError } = await supabase
      .from("materials")
      .select("*")
      .eq("id", materialId)
      .eq("user_id", user.id) // Verify ownership
      .single();

    if (fetchError || !material) {
      return NextResponse.json(
        { error: "Material not found or access denied" },
        { status: 404 }
      );
    }

    // Step 1: Delete from Supabase Storage (if not a URL)
    if (material.storage_path && !material.storage_path.startsWith("http")) {
      try {
        const { error: storageError } = await supabase.storage
          .from("materials")
          .remove([material.storage_path]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          // Continue anyway - don't block deletion if storage fails
        }
      } catch (storageErr) {
        console.error("Storage deletion exception:", storageErr);
        // Continue anyway
      }
    }

    // Step 2: Delete from OpenAI Files API (if exists)
    if (material.openai_file_id) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (openai.files as any).del(material.openai_file_id);
      } catch (openaiErr) {
        console.error("OpenAI file deletion error:", openaiErr);
        // Continue anyway - file might already be deleted
      }
    }

    // Step 3: Delete from database (this will cascade to related records via foreign keys)
    const { error: deleteError } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId)
      .eq("user_id", user.id); // Double-check ownership

    if (deleteError) {
      console.error("Database deletion error:", deleteError);
      return NextResponse.json(
        { error: `Error deleting material: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    const msg =
      error instanceof Error ? error.message : "Unexpected delete error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
