# API Documentation

The API is divided into three areas:

- `/api/auth/` — authentication and sessions
- `/api/user/` — endpoints used by regular users
- `/api/admin/` — administrative endpoints

All endpoints return JSON.

---

# Authentication API

Authentication uses a session-based system.

After a successful login, the server creates a session in the database and sends a `HttpOnly` cookie named `session`. The browser automatically sends this cookie with subsequent requests.

## POST `/api/auth/login`

Logs a user in.

### Request body

```json
{
  "username": "erik",
  "password": "password"
}
```

### Success

```json
{
  "success": true
}
```

A `session` cookie is set with:

- `HttpOnly`
- `SameSite=Strict`
- `Path=/`
- `Max-Age=2592000` (30 days)

### Invalid credentials

**Status:** `401`

```json
{
  "error": "Fel användarnamn eller lösenord"
}
```

---

## POST `/api/auth/logout`

Logs the current user out.

The current session is removed from the database and the `session` cookie is cleared.

### Response

```json
{
  "success": true
}
```

---

## GET `/api/auth/me`

Returns information about the currently logged-in user.

### Success

```json
{
  "id": 5,
  "username": "erik",
  "is_admin": 0
}
```

### Not logged in

**Status:** `401`

```json
{
  "error": "Ej inloggad"
}
```

---

# Admin API

All endpoints under `/api/admin/` require an authenticated administrator.

If the user is not an administrator:

**Status:** `403`

```json
{
  "error": "Kräver adminbehörighet"
}
```

## Matches

### GET `/api/admin/matches?tournament_id=X`

Returns all matches for a tournament.

### POST `/api/admin/matches`

Creates a match.

```json
{
  "tournament_id": 1,
  "home_team_id": 2,
  "away_team_id": 3,
  "kickoff_at": "2026-08-20T18:00:00Z"
}
```

`deadline_at` is automatically set to one hour before kickoff.

### PATCH `/api/admin/matches`

Updates a match.

```json
{
  "id": 15,
  "home_team_id": 2,
  "away_team_id": 4,
  "kickoff_at": "2026-08-20T19:00:00Z"
}
```

The deadline is recalculated from the new kickoff time.

### DELETE `/api/admin/matches`

Deletes a match.

```json
{
  "id": 15
}
```

---

## Match Results

### GET `/api/admin/match_results?match_id=X`

Returns the result of a match, or `null` if no result exists.

### PATCH `/api/admin/match_results`

Creates or updates a match result.

```json
{
  "match_id": 15,
  "home_score": 2,
  "away_score": 1,
  "after_extra_time": false,
  "after_penalties": false,
  "winner_team_id": 2
}
```

`after_extra_time`, `after_penalties`, and `winner_team_id` are optional.

---

## Teams

### GET `/api/admin/teams?tournament_id=X`

Returns all teams belonging to a tournament.

Teams are sorted by group and then name.

### POST `/api/admin/teams`

Creates a team.

```json
{
  "tournament_id": 1,
  "name": "Team A",
  "group_name": "A"
}
```

`group_name` is optional.

### PATCH `/api/admin/teams`

Updates a team.

```json
{
  "id": 10,
  "name": "Team A",
  "group_name": "B"
}
```

### DELETE `/api/admin/teams`

Deletes a team.

```json
{
  "id": 10
}
```

---

## Tournaments

### GET `/api/admin/tournaments`

Returns all tournaments, sorted by `start_date` descending.

### POST `/api/admin/tournaments`

Creates a tournament.

```json
{
  "name": "World Cup 2026",
  "start_date": "2026-06-11",
  "active": 1
}
```

If `active` is `1`, all other tournaments are automatically deactivated.

### PATCH `/api/admin/tournaments`

Updates a tournament.

```json
{
  "id": 5,
  "name": "World Cup 2026",
  "start_date": "2026-06-11",
  "active": 1
}
```

Setting `active` to `1` also deactivates all other tournaments.

### DELETE `/api/admin/tournaments`

Deletes a tournament.

```json
{
  "id": 5
}
```

---

## Prediction Questions

### GET `/api/admin/prediction_question?tournament_id=X`

Returns all prediction questions for a tournament.

### POST `/api/admin/prediction_question`

Creates a prediction question.

```json
{
  "tournament_id": 1,
  "label": "Which team will win the tournament?"
}
```

### PATCH `/api/admin/prediction_question`

Updates a prediction question.

```json
{
  "id": 10,
  "label": "Which team will win?"
}
```

### DELETE `/api/admin/prediction_question`

Deletes a prediction question.

```json
{
  "id": 10
}
```

---

## Question Results

### GET `/api/admin/question_result?question_id=X`

Returns the correct answer for a prediction question.

### POST `/api/admin/question_result`

Creates the correct answer.

```json
{
  "question_id": 10,
  "correct_answer_value": "Brazil"
}
```

### PATCH `/api/admin/question_result`

Updates the correct answer.

```json
{
  "question_id": 10,
  "correct_answer_value": "Argentina"
}
```

### DELETE `/api/admin/question_result`

Deletes the correct answer.

```json
{
  "question_id": 10
}
```

---

## Users

### GET `/api/admin/users`

Returns all users.

Passwords and password hashes are never returned.

### POST `/api/admin/users`

Creates a user.

```json
{
  "username": "erik",
  "password": "password",
  "is_admin": false
}
```

Passwords are hashed before being stored.

Returns `409` if the username is already in use.

### PATCH `/api/admin/users`

Updates a user.

```json
{
  "id": 10,
  "username": "erik",
  "password": "",
  "is_admin": false
}
```

An empty password keeps the existing password.

### DELETE `/api/admin/users`

Deletes a user.

```json
{
  "id": 10
}
```

---

# User API

The `/api/user/` endpoints are used by the website.

Some endpoints use the current session. The endpoints that explicitly check authentication return:

**Status:** `401`

```json
{
  "error": "Inte inloggad"
}
```

---

## Admin Contact

### GET `/api/user/admin-contact`

Returns the username of an administrator.

Does not require authentication.

```json
{
  "username": "admin"
}
```

If no administrator exists:

```json
{
  "username": null
}
```

---

## Matches

### GET `/api/user/matches`

Returns all matches in the active tournament.

### GET `/api/user/matches?coming_games=X`

Returns the next `X` future matches that the current user has not predicted yet.

The matches:

- belong to the active tournament
- have not started yet
- do not have a prediction from the current user

The results are sorted by kickoff time.

> Note: the current implementation calls `getCurrentUser()` but does not explicitly reject unauthenticated requests.

---

## Match Predictions

### GET `/api/user/match.predictions`

Returns the current user's saved match predictions.

```json
[
  {
    "match_id": 15,
    "home_score": 2,
    "away_score": 1
  }
]
```

### GET `/api/user/match.predictions?today=true`

Returns today's matches together with the current user's predictions.

### PATCH `/api/user/match.predictions`

Creates or updates a prediction.

```json
{
  "match_id": 15,
  "home_score": 2,
  "away_score": 1
}
```

Predictions cannot be changed after the match deadline.

Possible errors include:

- `400` — required fields are missing
- `403` — match deadline has passed
- `404` — match does not exist

---

## Prediction Questions

### GET `/api/user/prediction_questions`

Returns all prediction questions for the active tournament.

The current user's answer is included as `answer`, or `null` if they have not answered yet.

This endpoint requires authentication.

---

## Prediction Answers

### PATCH `/api/user/prediction_answers`

Creates or updates the current user's answer to a prediction question.

```json
{
  "question_id": 10,
  "answer": "Brazil"
}
```

This endpoint requires authentication.

Possible errors:

- `400` — required fields are missing
- `401` — user is not logged in
- `500` — database/server error

---

## Tournaments

### GET `/api/user/tournaments`

Returns the active tournament.

Only one active tournament is returned.

> Note: the current implementation calls `getCurrentUser()` but does not explicitly require authentication.

---

## Users

### GET `/api/user/users`

Returns all users.

Only `id` and `username` are returned.

Users are sorted alphabetically by username.

> Note: the current implementation calls `getCurrentUser()` but does not explicitly require authentication.

---

# Common Status Codes

| Status | Meaning |
|---|---|
| `400` | Invalid or missing input |
| `401` | Not authenticated |
| `403` | Insufficient permissions or deadline passed |
| `404` | Resource not found |
| `409` | Conflict, e.g. username already exists |
| `500` | Internal server/database error |

Errors are generally returned as:

```json
{
  "error": "Description of the error"
}
```