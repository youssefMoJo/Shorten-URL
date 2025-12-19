import crypto from "crypto";

/**
 * Generates a cryptographically secure random short code
 * @returns {string} 8-character URL-safe short code
 */
export function generateSecureShortCode() {
  // Generate 6 random bytes (6 * 8 = 48 bits of entropy)
  // Base64 encoding will convert 3 bytes to 4 characters
  // So 6 bytes = 8 base64 characters
  const randomBytes = crypto.randomBytes(6);

  // Convert to base64 and make URL-safe
  return randomBytes
    .toString("base64")
    .replace(/\+/g, "-")  // Replace + with -
    .replace(/\//g, "_")  // Replace / with _
    .replace(/=/g, "");   // Remove padding
}

/**
 * Validates a short code format
 * @param {string} shortCode - The short code to validate
 * @returns {boolean} True if valid
 */
export function isValidShortCode(shortCode) {
  if (!shortCode || typeof shortCode !== "string") {
    return false;
  }

  // Must be exactly 8 characters, only alphanumeric, dash, and underscore
  return /^[A-Za-z0-9_-]{8}$/.test(shortCode);
}
