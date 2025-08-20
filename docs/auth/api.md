# Auth API


## Endpoints

### POST `/api/auth/register`

**Description:** Register a new user.

**Request Body:**
```json
{
	"email": "user@example.com",
	"username": "user123",
	"password": "password123",
	"firstName": "John",
	"lastName": "Doe"
}
```

**Responses:**
- `201`: `{ message, user, token }`
- `400`: Validation error
- `409`: User already exists

---

### POST /api/auth/login

**Description:** Log in an existing user.

**Request Body:**
```json
{
	"email": "user@example.com",
	"password": "password123"
}
```

**Responses:**
- `200`: `{ message, user, token }`
- `400`: Validation error
- `401`: Invalid credentials

---

### GET /api/auth/me

**Description:** Get current authenticated user info.

**Headers:**
- Authorization: Bearer `<token>`

**Responses:**
- `200`: `user` object
- `401`: Unauthorized or invalid token
