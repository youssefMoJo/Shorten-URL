# API Usage Guide

## Authentication

### 1. Signup
Create a new account:

```bash
curl -X POST https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "YourPassword123!"
  }'
```

**Response:**
```json
{
  "message": "Account created successfully",
  "userId": "...",
  "email": "your@email.com",
  "tokens": {
    "idToken": "eyJraWQ...",
    "accessToken": "eyJraWQ...",
    "refreshToken": "...",
    "expiresIn": 3600
  }
}
```

### 2. Login
Login to an existing account:

```bash
curl -X POST https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "YourPassword123!"
  }'
```

**Response:** Same format as signup response.

## URL Shortening

### Anonymous Shortening
You can shorten URLs without authentication:

```bash
curl -X POST https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "long_link": "https://example.com"
  }'
```

**Response:**
```json
{
  "short_url": "https://shorturl.life/abc123",
  "short_code": "abc123"
}
```

The link will be stored with `UserId: "anonymous"`.

### Authenticated Shortening
To associate the shortened URL with your account, include your ID token:

```bash
curl -X POST https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "long_link": "https://example.com"
  }'
```

**Response:** Same format as anonymous shortening.

The link will be stored with your user ID and will appear in your `/me/links` list.

## Get Your Links

Retrieve all URLs you've shortened (requires authentication):

```bash
curl -X GET https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev/me/links \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

**Response:**
```json
{
  "count": 2,
  "links": [
    {
      "short_code": "VniVVNgy",
      "short_url": "https://shorturl.life/VniVVNgy",
      "original_url": "https://example.com/test-authenticated",
      "created_at": 1766187053315
    },
    {
      "short_code": "abc123",
      "short_url": "https://shorturl.life/abc123",
      "original_url": "https://example.com",
      "created_at": 1766187001234
    }
  ]
}
```

Links are sorted by creation date (newest first).

## URL Expansion

Get the original URL from a short code:

```bash
curl -X GET https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev/expand/abc123
```

**Response:**
```json
{
  "short_code": "abc123",
  "original_url": "https://example.com"
}
```

## Authentication Details

- **ID Token**: Use this in the `Authorization: Bearer <token>` header for authenticated requests
- **Token Expiry**: Tokens expire after 1 hour (3600 seconds)
- **Token Format**: JWT (JSON Web Token) containing user claims including `sub` (user ID)

## Important Notes

1. The `/shorten` endpoint supports both authenticated and anonymous requests
2. When you send an `Authorization` header, the Lambda function extracts your user ID from the JWT token
3. Without authentication, links are stored as "anonymous"
4. Only authenticated requests to `/shorten` will associate links with your account
5. The `/me/links` endpoint requires authentication and returns only your links
