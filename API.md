## Admin API

Alla endpoints under `/api/admin/` kräver att användaren är **inloggad som administratör**.

Autentisering sker via en `session`-cookie. Om användaren inte är inloggad som administratör returnerar API:t:

```json
{
  "error": "Kräver adminbehörighet"
}
```

med HTTP-status `403`.

Alla endpoints returnerar JSON.

---

## Matches

### GET `/api/admin/matches`

Hämtar alla matcher för en specifik turnering.

#### Query parameters

| Parameter       | Typ     | Obligatorisk | Beskrivning        |
| --------------- | ------- | ------------ | ------------------ |
| `tournament_id` | integer | Ja           | ID för turneringen |

#### Exempel

```http
GET /api/admin/matches?tournament_id=1
```

#### Response

```json
[
  {
    "id": 1,
    "home_team_id": 2,
    "away_team_id": 3,
    "kickoff_at": "2026-08-20T18:00:00.000Z",
    "deadline_at": "2026-08-20T17:00:00.000Z",
    "stage": "group",
    "status": "scheduled",
    "home_team": "Team A",
    "away_team": "Team B"
  }
]
```

Om `tournament_id` saknas:

```json
{
  "error": "tournament_id krävs"
}
```

Status: `400`

---

### POST `/api/admin/matches`

Skapar en ny match.

#### Request body

| Fält            | Typ     | Obligatorisk | Beskrivning        |
| --------------- | ------- | ------------ | ------------------ |
| `tournament_id` | integer | Ja           | ID för turneringen |
| `home_team_id`  | integer | Ja           | ID för hemmalaget  |
| `away_team_id`  | integer | Ja           | ID för bortalaget  |
| `kickoff_at`    | string  | Ja           | Matchens starttid  |

#### Exempel

```json
{
  "tournament_id": 1,
  "home_team_id": 2,
  "away_team_id": 3,
  "kickoff_at": "2026-08-20T18:00:00Z"
}
```

`deadline_at` beräknas automatiskt till **en timme före kickoff**.

#### Response

```json
{
  "id": 15
}
```

---

### PATCH `/api/admin/matches`

Uppdaterar en befintlig match.

#### Request body

| Fält           | Typ     | Obligatorisk | Beskrivning       |
| -------------- | ------- | ------------ | ----------------- |
| `id`           | integer | Ja           | ID för matchen    |
| `home_team_id` | integer | Ja           | ID för hemmalaget |
| `away_team_id` | integer | Ja           | ID för bortalaget |
| `kickoff_at`   | string  | Ja           | Matchens starttid |

#### Exempel

```json
{
  "id": 15,
  "home_team_id": 2,
  "away_team_id": 4,
  "kickoff_at": "2026-08-20T19:00:00Z"
}
```

`deadline_at` beräknas automatiskt till en timme före den nya kickoff-tiden.

#### Response

```json
{
  "success": true
}
```

---

### DELETE `/api/admin/matches`

Raderar en match.

#### Request body

```json
{
  "id": 15
}
```

#### Response

```json
{
  "success": true
}
```

---

## Match Results

### GET `/api/admin/match_results`

Hämtar resultatet för en match.

#### Query parameters

| Parameter  | Typ     | Obligatorisk | Beskrivning    |
| ---------- | ------- | ------------ | -------------- |
| `match_id` | integer | Ja           | ID för matchen |

#### Exempel

```http
GET /api/admin/match_results?match_id=15
```

#### Response

Om ett resultat finns:

```json
{
  "match_id": 15,
  "home_score": 2,
  "away_score": 1,
  "after_extra_time": 0,
  "after_penalties": 0,
  "winner_team_id": 2
}
```

Om inget resultat finns:

```json
null
```

---

### PATCH `/api/admin/match_results`

Skapar eller uppdaterar resultatet för en match.

#### Request body

| Fält               | Typ     | Obligatorisk | Beskrivning                            |
| ------------------ | ------- | ------------ | -------------------------------------- |
| `match_id`         | integer | Ja           | ID för matchen                         |
| `home_score`       | integer | Ja           | Hemmalagets resultat                   |
| `away_score`       | integer | Ja           | Bortalagets resultat                   |
| `after_extra_time` | boolean | Nej          | Om matchen avgjordes efter förlängning |
| `after_penalties`  | boolean | Nej          | Om matchen avgjordes efter straffar    |
| `winner_team_id`   | integer | Nej          | ID för vinnande lag                    |

#### Exempel

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

#### Response

```json
{
  "success": true
}
```

---

## Teams

### GET `/api/admin/teams`

Hämtar alla lag för en turnering.

#### Query parameters

| Parameter       | Typ     | Obligatorisk | Beskrivning        |
| --------------- | ------- | ------------ | ------------------ |
| `tournament_id` | integer | Ja           | ID för turneringen |

#### Exempel

```http
GET /api/admin/teams?tournament_id=1
```

#### Response

```json
[
  {
    "id": 1,
    "name": "Team A",
    "group_name": "A"
  },
  {
    "id": 2,
    "name": "Team B",
    "group_name": "A"
  }
]
```

Resultaten sorteras först efter `group_name` och sedan efter `name`.

---

### POST `/api/admin/teams`

Skapar ett nytt lag.

#### Request body

| Fält            | Typ     | Obligatorisk | Beskrivning        |
| --------------- | ------- | ------------ | ------------------ |
| `tournament_id` | integer | Ja           | ID för turneringen |
| `name`          | string  | Ja           | Lagets namn        |
| `group_name`    | string  | Nej          | Gruppens namn      |

#### Exempel

```json
{
  "tournament_id": 1,
  "name": "Team A",
  "group_name": "A"
}
```

#### Response

```json
{
  "id": 10
}
```

---

### PATCH `/api/admin/teams`

Uppdaterar ett lag.

#### Request body

```json
{
  "id": 10,
  "name": "Team A",
  "group_name": "B"
}
```

#### Response

```json
{
  "message": "Laget uppdaterades"
}
```

Om laget inte hittas:

```json
{
  "error": "Laget hittades inte"
}
```

Status: `404`

---

### DELETE `/api/admin/teams`

Raderar ett lag.

#### Request body

```json
{
  "id": 10
}
```

#### Response

```json
{
  "message": "Laget raderades"
}
```

---

## Tournaments

### GET `/api/admin/tournaments`

Hämtar alla turneringar.

#### Response

```json
[
  {
    "id": 1,
    "name": "VM 2026",
    "start_date": "2026-06-11",
    "active": 1
  }
]
```

Turneringarna sorteras efter `start_date` i fallande ordning.

---

### POST `/api/admin/tournaments`

Skapar en ny turnering.

#### Request body

| Fält         | Typ     | Obligatorisk | Beskrivning               |
| ------------ | ------- | ------------ | ------------------------- |
| `name`       | string  | Ja           | Turneringens namn         |
| `start_date` | string  | Nej          | Turneringens startdatum   |
| `active`     | integer | Nej          | `1` för aktiv, annars `0` |

#### Exempel

```json
{
  "name": "VM 2026",
  "start_date": "2026-06-11",
  "active": 1
}
```

Om `active` är `1` sätts alla andra turneringar automatiskt till inaktiva.

#### Response

```json
{
  "id": 5
}
```

---

### PATCH `/api/admin/tournaments`

Uppdaterar en turnering.

#### Request body

```json
{
  "id": 5,
  "name": "VM 2026",
  "start_date": "2026-06-11",
  "active": 1
}
```

Om `active` är `1` sätts alla andra turneringar automatiskt till inaktiva.

#### Response

```json
{
  "success": true
}
```

---

### DELETE `/api/admin/tournaments`

Raderar en turnering.

#### Request body

```json
{
  "id": 5
}
```

#### Response

```json
{
  "success": true
}
```

---

## Prediction Questions

### GET `/api/admin/prediction_question`

Hämtar alla utslagsfrågor för en turnering.

#### Query parameters

| Parameter       | Typ     | Obligatorisk | Beskrivning        |
| --------------- | ------- | ------------ | ------------------ |
| `tournament_id` | integer | Ja           | ID för turneringen |

#### Exempel

```http
GET /api/admin/prediction_question?tournament_id=1
```

#### Response

```json
[
  {
    "id": 1,
    "tournament_id": 1,
    "label": "Vilket lag vinner turneringen?"
  }
]
```

---

### POST `/api/admin/prediction_question`

Skapar en ny utslagsfråga.

#### Request body

```json
{
  "tournament_id": 1,
  "label": "Vilket lag vinner turneringen?"
}
```

#### Response

```json
{
  "id": 10
}
```

---

### PATCH `/api/admin/prediction_question`

Uppdaterar en utslagsfråga.

#### Request body

```json
{
  "id": 10,
  "label": "Vilket lag vinner?"
}
```

#### Response

```json
{
  "success": true,
  "id": 10
}
```

---

### DELETE `/api/admin/prediction_question`

Raderar en utslagsfråga.

#### Request body

```json
{
  "id": 10
}
```

#### Response

```json
{
  "success": true,
  "id": 10
}
```

---

## Question Results

### GET `/api/admin/question_result`

Hämtar det korrekta svaret för en utslagsfråga.

#### Query parameters

| Parameter     | Typ     | Obligatorisk | Beskrivning          |
| ------------- | ------- | ------------ | -------------------- |
| `question_id` | integer | Ja           | ID för utslagsfrågan |

#### Exempel

```http
GET /api/admin/question_result?question_id=10
```

#### Response

```json
[
  {
    "correct_answer_value": "Brazil"
  }
]
```

---

### POST `/api/admin/question_result`

Skapar ett korrekt svar för en utslagsfråga.

#### Request body

```json
{
  "question_id": 10,
  "correct_answer_value": "Brazil"
}
```

#### Response

```json
{
  "id": 15
}
```

---

### PATCH `/api/admin/question_result`

Uppdaterar det korrekta svaret för en utslagsfråga.

#### Request body

```json
{
  "question_id": 10,
  "correct_answer_value": "Argentina"
}
```

#### Response

```json
{
  "success": true,
  "question_id": 10
}
```

---

### DELETE `/api/admin/question_result`

Raderar det korrekta svaret för en utslagsfråga.

#### Request body

```json
{
  "question_id": 10
}
```

#### Response

```json
{
  "success": true,
  "question_id": 10
}
```

---

## Users

### GET `/api/admin/users`

Hämtar alla användare.

Lösenord och lösenordshash returneras **inte** av endpointen.

#### Response

```json
[
  {
    "id": 1,
    "username": "admin",
    "is_admin": 1,
    "created_at": "2026-08-01T12:00:00Z"
  }
]
```

Användarna sorteras efter användarnamn.

---

### POST `/api/admin/users`

Skapar en ny användare.

#### Request body

| Fält       | Typ     | Obligatorisk | Beskrivning                          |
| ---------- | ------- | ------------ | ------------------------------------ |
| `username` | string  | Ja           | Användarnamn                         |
| `password` | string  | Ja           | Lösenord                             |
| `is_admin` | boolean | Nej          | Om användaren ska vara administratör |

#### Exempel

```json
{
  "username": "erik",
  "password": "lösenord",
  "is_admin": false
}
```

Lösenordet hashas innan det sparas i databasen.

#### Response

```json
{
  "id": 10
}
```

Om användarnamnet redan används:

```json
{
  "error": "Användarnamnet är upptaget"
}
```

Status: `409`

---

### PATCH `/api/admin/users`

Uppdaterar en användare.

#### Request body

```json
{
  "id": 10,
  "username": "erik",
  "password": "",
  "is_admin": false
}
```

Om `password` är en tom sträng behålls det befintliga lösenordet. Om ett nytt lösenord anges hashas det innan det sparas.

#### Response

```json
{
  "success": true
}
```

---

### DELETE `/api/admin/users`

Raderar en användare.

#### Request body

```json
{
  "id": 10
}
```

#### Response

```json
{
  "success": true
}
```

---

## Gemensamma fel

Admin-endpoints kan returnera följande vanliga statuskoder:

| Status | Betydelse                                  |
| ------ | ------------------------------------------ |
| `400`  | Obligatorisk parameter eller data saknas   |
| `403`  | Användaren är inte administratör           |
| `404`  | Resursen hittades inte                     |
| `409`  | Konflikt, exempelvis upptaget användarnamn |
| `500`  | Ett internt server-/databasfel inträffade  |

När ett fel uppstår returneras normalt ett JSON-objekt med ett `error`-fält:

```json
{
  "error": "Beskrivning av felet"
}
```


## User API

Endpoints under `/api/user/` används av användare på webbplatsen.

Vissa endpoints kräver att användaren är inloggad. Autentisering sker via `session`-cookie.

### Autentisering

Endpoints som uttryckligen kräver inloggning returnerar följande om ingen giltig session finns:

```json
{
  "error": "Inte inloggad"
}
```

med HTTP-status `401`.

---

## Admin Contact

### GET `/api/user/admin-contact`

Hämtar användarnamnet för en administratör.

Endpointen kräver inte att användaren är inloggad.

#### Response

Om en administratör finns:

```json
{
  "username": "admin"
}
```

Om ingen administratör finns:

```json
{
  "username": null
}
```

---

## Matches

### GET `/api/user/matches`

Hämtar alla matcher för den aktiva turneringen.

Endpointen använder den inloggade användaren för `coming_games`, men den nuvarande implementationen stoppar inte en oinloggad användare.

#### Exempel

```http
GET /api/user/matches
```

#### Response

```json
[
  {
    "id": 1,
    "kickoff_at": "2026-08-20T18:00:00.000Z",
    "deadline_at": "2026-08-20T17:00:00.000Z",
    "home_team": "Team A",
    "away_team": "Team B"
  }
]
```

---

### GET `/api/user/matches?coming_games=X`

Hämtar de närmaste `X` framtida matcher som den aktuella användaren **inte har tippat på ännu**.

Matcherna måste:

* tillhöra den aktiva turneringen
* ha en kickoff-tid i framtiden
* sakna ett sparat tips från användaren

Resultaten sorteras efter kickoff, tidigast först.

#### Query parameters

| Parameter      | Typ     | Obligatorisk              | Beskrivning                     |
| -------------- | ------- | ------------------------- | ------------------------------- |
| `coming_games` | integer | Ja för begränsat resultat | Antal kommande otippade matcher |

#### Exempel

```http
GET /api/user/matches?coming_games=3
```

#### Response

```json
[
  {
    "id": 15,
    "kickoff_at": "2026-08-20T18:00:00.000Z",
    "deadline_at": "2026-08-20T17:00:00.000Z",
    "home_team": "Team A",
    "away_team": "Team B"
  }
]
```

---

## Match Predictions

### GET `/api/user/match.predictions`

Hämtar den inloggade användarens sparade matchtips.

#### Exempel

```http
GET /api/user/match.predictions
```

#### Response

```json
[
  {
    "match_id": 15,
    "home_score": 2,
    "away_score": 1
  },
  {
    "match_id": 16,
    "home_score": 1,
    "away_score": 1
  }
]
```

---

### GET `/api/user/match.predictions?today=true`

Hämtar dagens matcher tillsammans med användarens tips.

Response innehåller även användarens användarnamn och ID.

#### Exempel

```http
GET /api/user/match.predictions?today=true
```

#### Response

```json
{
  "current_username": "erik",
  "current_user_id": 5,
  "matches": [
    {
      "username": "erik",
      "match_id": 15,
      "home_team": "Team A",
      "away_team": "Team B",
      "kickoff_at": "2026-08-20T18:00:00.000Z",
      "deadline_at": "2026-08-20T17:00:00.000Z",
      "user_id": 5,
      "home_score": 2,
      "away_score": 1
    }
  ]
}
```

---

### PATCH `/api/user/match.predictions`

Skapar eller uppdaterar användarens tips för en match.

Ett tips kan endast ändras innan matchens deadline.

#### Request body

| Fält         | Typ     | Obligatorisk | Beskrivning                       |
| ------------ | ------- | ------------ | --------------------------------- |
| `match_id`   | integer | Ja           | ID för matchen                    |
| `home_score` | integer | Ja           | Förväntat resultat för hemmalaget |
| `away_score` | integer | Ja           | Förväntat resultat för bortalaget |

#### Exempel

```json
{
  "match_id": 15,
  "home_score": 2,
  "away_score": 1
}
```

#### Response

```json
{
  "success": true
}
```

#### Fel

Om matchen inte finns:

```json
{
  "error": "Matchen finns inte"
}
```

Status: `404`

Om deadline har passerat:

```json
{
  "error": "Deadline för matchen har passerat"
}
```

Status: `403`

Om obligatoriska fält saknas:

```json
{
  "error": "Match-id och resultat krävs"
}
```

Status: `400`

---

## Prediction Questions

### GET `/api/user/prediction_questions`

Hämtar alla utslagsfrågor för den aktiva turneringen.

Användarens tidigare svar inkluderas i resultatet om ett svar redan finns.

Endpointen kräver inloggning.

#### Exempel

```http
GET /api/user/prediction_questions
```

#### Response

```json
[
  {
    "id": 1,
    "tournament_id": 5,
    "label": "Vilket lag vinner turneringen?",
    "start_date": "2026-06-11",
    "answer": "Brazil"
  },
  {
    "id": 2,
    "tournament_id": 5,
    "label": "Vilket lag gör flest mål?",
    "start_date": "2026-06-11",
    "answer": null
  }
]
```

`answer` är `null` om användaren ännu inte har svarat på frågan.

---

## Prediction Answers

### PATCH `/api/user/prediction_answers`

Skapar eller uppdaterar användarens svar på en utslagsfråga.

Endpointen kräver inloggning.

#### Request body

| Fält          | Typ     | Obligatorisk | Beskrivning          |
| ------------- | ------- | ------------ | -------------------- |
| `question_id` | integer | Ja           | ID för utslagsfrågan |
| `answer`      | string  | Ja           | Användarens svar     |

#### Exempel

```json
{
  "question_id": 10,
  "answer": "Brazil"
}
```

Om användaren redan har svarat på frågan uppdateras det befintliga svaret.

#### Response

```json
{
  "success": true
}
```

#### Fel

Om användaren inte är inloggad:

```json
{
  "error": "Inte inloggad"
}
```

Status: `401`

Om obligatoriska fält saknas:

```json
{
  "error": "question_id och answer krävs"
}
```

Status: `400`

---

## Tournaments

### GET `/api/user/tournaments`

Hämtar den aktiva turneringen.

Endpointen anropar `getCurrentUser()`, men kräver i nuläget **inte** att användaren faktiskt är inloggad.

#### Response

```json
[
  {
    "id": 5,
    "name": "VM 2026",
    "start_date": "2026-06-11"
  }
]
```

Eftersom frågan använder `LIMIT 1` returneras maximalt en aktiv turnering.

---

## Users

### GET `/api/user/users`

Hämtar alla användare.

Endpointen anropar `getCurrentUser()`, men kräver i nuläget **inte** att användaren faktiskt är inloggad.

Lösenord och lösenordshash returneras inte.

#### Response

```json
[
  {
    "id": 1,
    "username": "admin"
  },
  {
    "id": 2,
    "username": "erik"
  }
]
```

Användarna sorteras alfabetiskt efter användarnamn.

---

## Sammanfattning

| Endpoint                         | Method | Inloggning | Funktion                  |
| -------------------------------- | ------ | ---------- | ------------------------- |
| `/api/user/admin-contact`        | GET    | Nej        | Hämta admin-kontakt       |
| `/api/user/matches`              | GET    | Nej*       | Hämta matcher             |
| `/api/user/match.predictions`    | GET    | Ja*        | Hämta egna matchtips      |
| `/api/user/match.predictions`    | PATCH  | Ja*        | Skapa/uppdatera matchtips |
| `/api/user/prediction_questions` | GET    | Ja         | Hämta utslagsfrågor       |
| `/api/user/prediction_answers`   | PATCH  | Ja         | Skapa/uppdatera svar      |
| `/api/user/tournaments`          | GET    | Nej*       | Hämta aktiv turnering     |
| `/api/user/users`                | GET    | Nej*       | Hämta användare           |

`*` Endpointen anropar `getCurrentUser()`, men kontrollerar inte om resultatet är `null`. Den kräver därför inte faktiskt inloggning i den nuvarande implementationen.
