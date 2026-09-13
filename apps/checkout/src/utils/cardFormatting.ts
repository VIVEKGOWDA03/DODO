export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function formatCvc(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export function lastFourDigits(formattedCardNumber: string): string {
  const digits = formattedCardNumber.replace(/\D/g, "");
  return digits.slice(-4);
}

export function maskCardNumber(formattedCardNumber: string): string {
  const digits = formattedCardNumber.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const groups = ["••••", "••••", "••••", last4.padStart(4, "•")];
  return groups.join(" ");
}

export function detectCardBrand(formattedCardNumber: string): "visa" | "mastercard" | null {
  const digits = formattedCardNumber.replace(/\D/g, "");
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  return null;
}
