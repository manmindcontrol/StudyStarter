import { createClient } from "@supabase/supabase-js";

/**
 * Sanitize filename - remove diacritics, special chars, and spaces
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s.-]/g, "") // Remove special characters except dots, hyphens, underscores
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .toLowerCase();
}

/**
 * Create authenticated Supabase service role client
 * Use this for server-side operations that require admin access
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
