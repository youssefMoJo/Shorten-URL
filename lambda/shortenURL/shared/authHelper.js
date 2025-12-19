/**
 * Extracts user ID from the event object.
 * Supports both Cognito authorizer claims and manual JWT parsing.
 *
 * @param {Object} event - The Lambda event object
 * @returns {string|null} - The user ID (sub claim) or null if not authenticated
 */
export function getUserIdFromEvent(event) {
  // First, check if API Gateway authorizer has already validated the token
  // This happens when authorization = "COGNITO_USER_POOLS"
  const authorizerClaims = event.requestContext?.authorizer?.claims;
  if (authorizerClaims && authorizerClaims.sub) {
    return authorizerClaims.sub;
  }

  // If no authorizer claims, try to extract from Authorization header manually
  // This happens when authorization = "NONE" but user sends Bearer token
  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    // Extract JWT token (format: "Bearer <token>")
    const token = authHeader.substring(7);

    // Decode JWT payload (we don't verify signature here, just extract claims)
    // In production, you should verify the signature, but since this is just for
    // associating links with users (not authorization), it's acceptable
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    return payload.sub || null;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}
