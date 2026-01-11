import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reasons, otherReason } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user's email before deletion
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError) {
      console.error("Error fetching user data:", userError);
    }

    const userEmail = userData?.user?.email || "unknown";

    // Log the deletion reason to database for analytics
    try {
      await supabaseAdmin.rpc("log_account_deletion", {
        p_user_id: userId,
        p_user_email: userEmail,
        p_reasons: reasons || [],
        p_other_reason: otherReason || null,
      });
    } catch (logError) {
      // Don't fail the deletion if logging fails
      console.error("Failed to log account deletion:", logError);
    }

    // Delete user's data from related tables
    // 1. Delete study materials
    const { error: materialsError } = await supabaseAdmin
      .from("study_materials")
      .delete()
      .eq("user_id", userId);

    if (materialsError) {
      console.error("Error deleting study materials:", materialsError);
    }

    // 2. Delete study notes
    const { error: notesError } = await supabaseAdmin
      .from("study_notes")
      .delete()
      .eq("user_id", userId);

    if (notesError) {
      console.error("Error deleting study notes:", notesError);
    }

    // 3. Delete question sets
    const { error: questionsError } = await supabaseAdmin
      .from("question_sets")
      .delete()
      .eq("user_id", userId);

    if (questionsError) {
      console.error("Error deleting question sets:", questionsError);
    }

    // 4. Delete lecture recordings
    const { error: lecturesError } = await supabaseAdmin
      .from("lecture_recordings")
      .delete()
      .eq("user_id", userId);

    if (lecturesError) {
      console.error("Error deleting lecture recordings:", lecturesError);
    }

    // 5. Delete user profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
    }

    // 6. Finally, delete the user from Supabase Auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteUserError) {
      console.error("Error deleting user from auth:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to delete user account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Unexpected error while deleting account";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
