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
    // First get all materials and lectures to clean up storage
    const { data: materials } = await supabaseAdmin
      .from("materials")
      .select("storage_path, openai_file_id")
      .eq("user_id", userId);

    const { data: lectures } = await supabaseAdmin
      .from("lectures")
      .select("*")
      .eq("user_id", userId);

    // 1. Delete materials storage files
    if (materials && materials.length > 0) {
      for (const material of materials) {
        // Delete from Supabase Storage
        if (material.storage_path && !material.storage_path.startsWith("http")) {
          try {
            await supabaseAdmin.storage
              .from("materials")
              .remove([material.storage_path]);
          } catch (err) {
            console.error("Error deleting material file:", err);
          }
        }

        // Delete from OpenAI Files API
        if (material.openai_file_id) {
          try {
            const OpenAI = (await import("openai")).default;
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (openai.files as any).del(material.openai_file_id);
          } catch (err) {
            console.error("Error deleting OpenAI file:", err);
          }
        }
      }
    }

    // 2. Delete lecture audio files
    if (lectures && lectures.length > 0) {
      for (const lecture of lectures) {
        const audioPath = (lecture as { audio_file_path?: string }).audio_file_path;
        if (audioPath) {
          try {
            await supabaseAdmin.storage
              .from("lecture-recordings")
              .remove([audioPath]);
          } catch (err) {
            console.error("Error deleting lecture audio:", err);
          }
        }
      }
    }

    // 3. Delete from database (cascade will handle related records)
    // Note: Order matters for foreign key constraints
    const { error: chatError } = await supabaseAdmin
      .from("chat_history")
      .delete()
      .eq("user_id", userId);

    if (chatError) {
      console.error("Error deleting chat history:", chatError);
    }

    const { error: questionsError } = await supabaseAdmin
      .from("generated_questions")
      .delete()
      .eq("user_id", userId);

    if (questionsError) {
      console.error("Error deleting generated questions:", questionsError);
    }

    const { error: notesError } = await supabaseAdmin
      .from("study_notes")
      .delete()
      .eq("user_id", userId);

    if (notesError) {
      console.error("Error deleting study notes:", notesError);
    }

    const { error: materialsError } = await supabaseAdmin
      .from("materials")
      .delete()
      .eq("user_id", userId);

    if (materialsError) {
      console.error("Error deleting materials:", materialsError);
    }

    const { error: lecturesError } = await supabaseAdmin
      .from("lectures")
      .delete()
      .eq("user_id", userId);

    if (lecturesError) {
      console.error("Error deleting lectures:", lecturesError);
    }

    const { error: usageError } = await supabaseAdmin
      .from("usage_tracking")
      .delete()
      .eq("user_id", userId);

    if (usageError) {
      console.error("Error deleting usage tracking:", usageError);
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (subscriptionError) {
      console.error("Error deleting user subscriptions:", subscriptionError);
    }

    const { error: paymentsError} = await supabaseAdmin
      .from("payment_history")
      .delete()
      .eq("user_id", userId);

    if (paymentsError) {
      console.error("Error deleting payment history:", paymentsError);
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
