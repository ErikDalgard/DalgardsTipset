INSERT INTO tournaments (name, status, start_date) VALUES ('Test-VM', 'upcoming', '2026-06-01');

INSERT INTO teams (tournament_id, name, group_name) VALUES
  (1, 'Sverige', 'A'),
  (1, 'Danmark', 'A'),
  (1, 'Tyskland', 'B'),
  (1, 'Frankrike', 'B');