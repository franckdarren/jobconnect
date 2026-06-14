const GABON_COUNTRY_CODE = "241";

/**
 * Normalize a phone for wa.me. wa.me requires E.164 digits only (no '+').
 * Defaults to Gabon (+241) when no country code is detected.
 *
 * Examples:
 *   "+24177123456" → "24177123456"
 *   "24177123456"  → "24177123456"
 *   "077123456"    → "24177123456"  (drop leading 0, prepend 241)
 *   "77123456"     → "24177123456"  (prepend 241)
 *   "0024177..."   → "24177..."     (drop international 00 prefix)
 */
function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(GABON_COUNTRY_CODE)) return digits;
  if (digits.startsWith("0")) return `${GABON_COUNTRY_CODE}${digits.slice(1)}`;
  if (digits.length <= 9) return `${GABON_COUNTRY_CODE}${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function candidateContactMessage(jobTitle: string): string {
  return `Bonjour, je vous contacte concernant votre candidature sur 241Job pour le poste de ${jobTitle}.`;
}

export function employerContactMessage(candidateName: string): string {
  return `Bonjour ${candidateName}, j'ai consulté votre profil sur 241Job et je souhaite vous contacter.`;
}
