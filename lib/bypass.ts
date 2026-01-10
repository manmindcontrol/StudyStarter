/**
 * Universal Bypass Helper
 * Umožňuje testovacím účtom používať všetky funkcie aplikácie
 * - PDF konvertor bez Stripe platby
 * - Všetky premium funkcie v dashboarde
 * - Neobmedzené nahrávanie materiálov a prednášok
 */

import { getCurrentUser } from './auth';

/**
 * Kontroluje, či aktuálny používateľ má bypass oprávnenie
 * @returns true ak používateľ má testovací prístup ku všetkým funkciám
 */
export async function checkBypass(): Promise<boolean> {
  const bypassEmail = process.env.BYPASS_EMAIL || process.env.PDF_BYPASS_EMAIL;

  // Ak nie je nastavený bypass email, nikto nemôže obísť platbu
  if (!bypassEmail) {
    return false;
  }

  // Skontroluj aktuálneho používateľa
  const { user } = await getCurrentUser();

  // Ak nie je prihlásený, nemôže obísť platbu
  if (!user || !user.email) {
    return false;
  }

  // Porovnaj email používateľa s bypass emailom
  return user.email.toLowerCase() === bypassEmail.toLowerCase();
}

/**
 * Kontroluje, či daný email má bypass oprávnenie (server-side)
 * @param email Email na kontrolu
 * @returns true ak email môže obísť všetky obmedzenia
 */
export function checkEmailBypass(email: string): boolean {
  const bypassEmail = process.env.BYPASS_EMAIL || process.env.PDF_BYPASS_EMAIL;

  if (!bypassEmail) {
    return false;
  }

  return email.toLowerCase() === bypassEmail.toLowerCase();
}

// Deprecated - použite checkBypass()
export const checkPdfBypass = checkBypass;
