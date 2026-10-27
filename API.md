# Frontend API integration

This guide documents the HTTP endpoints currently exposed by the backend, including request payloads and response shapes.

## Connection and request conventions

- Local base URL: `https://workouttrackerbackend-dsfo.onrender.com`
- There is no global API prefix. Routes below are relative to the base URL.
- Send JSON request bodies with `Content-Type: application/json`.
- Workout endpoints require `Authorization: Bearer <accessToken>`.
- Authentication endpoints and the `/users` endpoints do not require a bearer token.
- The server does not currently enable CORS. If the frontend runs on a different origin, configure CORS on the backend before making browser requests.

## Authentication

### Register

`POST /auth/register`

Request:

```json
{
  "name": "Alex Runner",
  "email": "alex@example.com",
  "password": "securepass123"
}
```

`name` is optional. Email is trimmed and lowercased. Password must be at least 8 characters.

Success (`201 Created`):

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": "1h",
  "refreshExpiresIn": "7d",
  "user": {
    "id": "<uuid>",
    "name": "Alex Runner",
    "email": "alex@example.com"
  }
}
```

The expiration values shown are defaults and can be changed through server configuration. The password is not included in the response.

Common errors: `400` for invalid email or a password shorter than 8 characters; `409` if the email is already registered.

### Log in

`POST /auth/login`

Request:

```json
{
  "email": "alex@example.com",
  "password": "securepass123"
}
```

Success (`201 Created`): same response shape as registration.

Common error: `401` for invalid credentials.

### Refresh tokens

`POST /auth/refresh`

Request:

```json
{
  "refreshToken": "<refresh-jwt>"
}
```

Success (`201 Created`): a newly issued token response with the same shape as registration and login. Send the refresh token in the request body; this endpoint does not use the bearer header.

Common error: `401` if the refresh token is invalid, expired, or belongs to a user that no longer exists.

### Get the signed-in profile

`GET /auth/profile`

Headers:

```http
Authorization: Bearer <accessToken>
```

Success (`200 OK`):

```json
{
  "userId": "<uuid>",
  "email": "alex@example.com"
}
```

Common error: `401` for a missing, invalid, or expired access token.

## Workouts

All `/workouts` endpoints require a valid access token in the `Authorization` header. Workout IDs are UUIDs. A workout is only visible to the user who created it.

Workout response object:

```json
{
  "id": "<uuid>",
  "name": "Push day",
  "exercises": [
    {
      "name": "Bench press",
      "sets": 3,
      "reps": 8,
      "weight": 60
    }
  ],
  "createdAt": "2026-10-27T12:00:00.000Z",
  "userId": "<uuid>"
}
```

Each exercise requires a non-empty `name`, positive integer `sets` and `reps`, and a non-negative numeric `weight`.

### Create a workout

`POST /workouts`

Request:

```json
{
  "name": "Push day",
  "exercises": [
    {
      "name": "Bench press",
      "sets": 3,
      "reps": 8,
      "weight": 60
    }
  ]
}
```

Success (`201 Created`):

```json
{
  "message": "Workout created successfully",
  "workout": {
    "id": "<uuid>",
    "name": "Push day",
    "exercises": [
      {
        "name": "Bench press",
        "sets": 3,
        "reps": 8,
        "weight": 60
      }
    ],
    "createdAt": "2026-10-27T12:00:00.000Z",
    "userId": "<uuid>"
  }
}
```

### List workouts

`GET /workouts`

Success (`200 OK`): an array of the signed-in user's workout objects, newest first. An account with no workouts receives `[]`.

### Get one workout

`GET /workouts/:id`

Success (`200 OK`): the workout object.

Common error: `404` if the workout does not exist or belongs to another user.

### Update a workout

`PATCH /workouts/:id`

Send one or both fields. If `exercises` is supplied, it replaces the complete exercise array.

Request example:

```json
{
  "name": "Updated push day",
  "exercises": [
    {
      "name": "Incline dumbbell press",
      "sets": 4,
      "reps": 10,
      "weight": 22.5
    }
  ]
}
```

Success (`200 OK`):

```json
{
  "message": "Workout updated successfully",
  "workout": {
    "id": "<uuid>",
    "name": "Updated push day",
    "exercises": [
      {
        "name": "Incline dumbbell press",
        "sets": 4,
        "reps": 10,
        "weight": 22.5
      }
    ],
    "createdAt": "2026-10-27T12:00:00.000Z",
    "userId": "<uuid>"
  }
}
```

Common errors: `400` for an invalid supplied field or exercise; `404` if the workout does not exist or belongs to another user.

### Delete a workout

`DELETE /workouts/:id`

Success (`200 OK`):

```json
{
  "message": "Workout deleted successfully"
}
```

Common error: `404` if the workout does not exist or belongs to another user.

## Users

The `/users` endpoints are currently not part of the authenticated account workflow. They do not require a bearer token. Only create is implemented as a database operation; list, get, update, and delete currently return placeholder strings and should not be used by the frontend as functional user-management APIs.

### Create a user

`POST /users`

Request:

```json
{
  "name": "Alex Runner",
  "email": "alex@example.com",
  "password": "securepass123"
}
```

Success (`201 Created`):

```json
{
  "message": "user created successfully",
  "user": {
    "id": "<uuid>",
    "name": "Alex Runner",
    "email": "alex@example.com"
  }
}
```

The password is hashed and omitted from the response. A duplicate email returns `409 Conflict`. For normal frontend sign-up, use `/auth/register` instead; it also returns the tokens required to call workout endpoints.

### Placeholder user routes

These routes currently return plain text, not user records:

| Method | Route | Current response |
| --- | --- | --- |
| `GET` | `/users` | `"This action returns all users"` |
| `GET` | `/users/:id` | `"This action returns a #<id> user"` |
| `PATCH` | `/users/:id` | `"This action updates a #<id> user"` |
| `DELETE` | `/users/:id` | `"This action removes a #<id> user"` |

## Error responses

Errors use NestJS's standard JSON exception response. For example, an invalid workout request may return `400 Bad Request`:

```json
{
  "message": "Workout name is required",
  "error": "Bad Request",
  "statusCode": 400
}
```

The `message` can be a string or an array of strings for framework-level validation errors. The current endpoints primarily validate inputs inside their services.

## Example frontend request

```js
const response = await fetch(`${API_BASE_URL}/workouts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    name: 'Push day',
    exercises: [{ name: 'Bench press', sets: 3, reps: 8, weight: 60 }],
  }),
});

const data = await response.json();

if (!response.ok) {
  throw new Error(
    Array.isArray(data.message) ? data.message.join(', ') : data.message,
  );
}
```

Set `API_BASE_URL` to the backend origin, for example `http://localhost:3000`.
