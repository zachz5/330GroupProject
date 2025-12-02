/**
 * Formats phone number input to (XXX) XXX-XXXX format as user types
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  
  // Format based on length
  if (limitedDigits.length === 0) {
    return '';
  } else if (limitedDigits.length <= 3) {
    return `(${limitedDigits}`;
  } else if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  } else {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  }
}

/**
 * Validates phone number is in (XXX) XXX-XXXX format
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  const regex = /^\(\d{3}\) \d{3}-\d{4}$/;
  return regex.test(phone);
}

/**
 * Extracts digits from formatted phone number
 */
export function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 10);
}



