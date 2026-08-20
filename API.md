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

Returns all questions for a tournament.

### POST `/api/admin/prediction_question`

Creates a question.

```json
{
  "tournament_id": 1,
  "label": "Which team will win the tournament?"
}
```

### PATCH `/api/admin/prediction_question`

Updates a  question.

```json
{
  "id": 10,
  "label": "Which team will win?"
}
```

### DELETE `/api/admin/prediction_question`

Deletes a question.

```json
{
  "id": 10
}
```

---

**## Question Results**

**### GET `/api/admin/question_result?question_id=X`**

Returns the correct answer for a prediction question.

The response is an array containing the matching result.

**### Missing `question_id`**

**Status:** `400`

```json
{
  "error": "question_id krävs"
}
```

**### POST `/api/admin/question_result`**

Creates the correct answer for a prediction question.

```json
{
  "question_id": 10,
  "correct_answer_value": "Brazil"
}
```

Both `question_id` and `correct_answer_value` are required.

When the correct answer is created, the points for all existing answers to the question are recalculated.

**### Success**

```json
{
  "id": 15
}
```

**### PATCH `/api/admin/question_result`**

Creates or updates the correct answer.

```json
{
  "question_id": 10,
  "correct_answer_value": "Argentina"
}
```

If a result already exists for the question, its `correct_answer_value` is updated. Otherwise, a new result is created.

The points for all existing answers to the question are recalculated.

### Success

```json
{
  "success": true,
  "question_id": 10,
  "correct_answer_value": "Argentina"
}
```

### DELETE `/api/admin/question_result`

Deletes the correct answer for a prediction question.

```json
{
  "question_id": 10
}
```

All points for user answers to the question are reset to `null`.

### Success**

```json
{
  "success": true,
  "question_id": 10,
  "deleted": true
}
```

`deleted` is `false` if no correct answer existed for the question.

### Invalid input

**Status:** `400`

```json
{
  "error": "question_id krävs"
}
```

For `POST` and `PATCH`, the error is returned if either `question_id` or `correct_answer_value` is missing.

### Server/database error

**Status:** `500`

The response contains an `error` message and a `details` field containing the database/server error.


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

## Scoring Rules

### GET `/api/admin/scoring_rules?tournament_id=X`

Returns the scoring rules for a tournament.


```json
[
  {
    "rule_type": "exact_score",
    "points": 3
  }
]
````
# User API

The `/api/user/` endpoints are used by the website.

Endpoints use the current session. The endpoints that explicitly check authentication return:

**Status:** `401`

```json
{
  "error": "Inte inloggad"
}
```

### POST `/api/admin/scoring_rules`

Creates or updates a scoring rule for a tournament.

Only one rule is created or updated per request.

The request uses `tournament_id` and `rule_type` to identify the rule. If the rule already exists for the tournament, its `points` value is updated.

### Request body

```json
{
  "tournament_id": 1,
  "rule_type": "exact_score",
  "points": 3
}
```

`tournament_id` and `points` are required.

### Success

```json
{
  "success": true
}
```

### Invalid input

**Status:** `400`

```json
{
  "error": "tournament_id och points krävs"
}
```

The endpoint requires an authenticated administrator.


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


---

## Match Predictions

### GET `/api/user/match_predictions`

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

### GET `/api/user/match_predictions?today=true`

Returns today's matches together with the current user's predictions.

### PATCH `/api/user/match_predictions`

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
## All Predictions

### GET `/api/user/all_predictions`

Returns all predictions for all participants in the active tournament, together with match information and results.

Returns `401` if the user is not logged in.

Returns `500` if the predictions cannot be retrieved.


## Prediction Questions

### GET `/api/user/prediction_questions`

Returns all questions for the active tournament.

The current user's answer is included as `answer`, or `null` if they have not answered yet.

---

## Prediction Answers

### PATCH `/api/user/prediction_answers`

Creates or updates the current user's answer to a question.

```json
{
  "question_id": 10,
  "answer": "Brazil"
}
```
Possible errors:

- `400` — required fields are missing
- `401` — user is not logged in
- `500` — database/server error

---

## Knockout Questions

### GET `/api/user/knockout_questions`

Returns all prediction questions and all participants' answers for the active tournament, including the correct answer and earned points.

Results are sorted by question and then username.

Returns `500` if the data cannot be retrieved.


---

## Standings

### GET `/api/user/standings`

Returns the current standings for the active tournament, sorted by points descending.

### GET `/api/user/standings?my_points=true`

Returns only the current user's points and position in the standings.

Returns `500` if the standings cannot be retrieved.


---

## Standings History**

### GET `/api/user/standings_history`

Returns the points history for all users in the active tournament.

The response includes the current user's ID and points data sorted by match kickoff time and username.

Returns `500` if the points history cannot be retrieved.


## Tournaments

### GET `/api/user/tournaments`

Returns the active tournament.

Only one active tournament is returned.

---

## Users

### GET `/api/user/users`

Returns all users.

Only `id` and `username` are returned.

Users are sorted alphabetically by username.

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