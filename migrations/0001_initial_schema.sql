CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  start_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_name TEXT
);


CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'group',
  home_team_id INTEGER NOT NULL REFERENCES teams(id),
  away_team_id INTEGER NOT NULL REFERENCES teams(id),
  kickoff_at TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  is_active_for_tips INTEGER NOT NULL DEFAULT 1
);


CREATE TABLE match_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(match_id, user_id)
);


CREATE TABLE match_results (
  match_id INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  after_extra_time INTEGER NOT NULL DEFAULT 0,
  after_penalties INTEGER NOT NULL DEFAULT 0,
  winner_team_id INTEGER REFERENCES teams(id)
);


CREATE TABLE prediction_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL
);


CREATE TABLE prediction_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES prediction_questions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  answer_value TEXT NOT NULL,
  UNIQUE(question_id, user_id)
);


CREATE TABLE question_results (
  question_id INTEGER PRIMARY KEY REFERENCES prediction_questions(id) ON DELETE CASCADE,
  correct_answer_value TEXT NOT NULL
);


CREATE TABLE scoring_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  points INTEGER NOT NULL
);


CREATE TABLE participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'player',
  UNIQUE(tournament_id, user_id)
);