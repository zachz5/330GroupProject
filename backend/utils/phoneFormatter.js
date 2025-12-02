/**
 * Formats phone number to (XXX) XXX-XXXX format
 * @param {string} phone - Phone number to format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
export function formatPhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If we have exactly 10 digits, format it
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  
  // If we have 11 digits and starts with 1, remove the 1 and format
  if (digits.length === 11 && digits.startsWith('1')) {
    const tenDigits = digits.substring(1);
    return `(${tenDigits.substring(0, 3)}) ${tenDigits.substring(3, 6)}-${tenDigits.substring(6)}`;
  }
  
  // If already in correct format, return as is
  if (/^\(\d{3}\) \d{3}-\d{4}$/.test(phone)) {
    return phone;
  }
  
  // If we can't format it, return null
  return null;
}



