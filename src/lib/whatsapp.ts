/**
 * Normalize a phone for wa.me — keep only digits, drop leading +.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function candidateContactMessage(jobTitle: string): string {
  return `Bonjour, je vous contacte concernant votre candidature sur JobConnect pour le poste de ${jobTitle}.`;
}

export function employerContactMessage(candidateName: string): string {
  return `Bonjour ${candidateName}, j'ai consulté votre profil sur JobConnect et je souhaite vous contacter.`;
}
