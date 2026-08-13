// Genera folios legibles y códigos cortos de referido.

// AFF-20260813-4F2A9C
export const generateAffiliateReference = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AFF-${y}${m}${d}-${random}`;
};

// Código corto para el link de referido de un concierge: ?ref=CODIGO
// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const generateReferralCode = (length = 7) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
};
