-- Demoanvändare
INSERT INTO users (username, password_hash, is_admin) VALUES
('test', 'e695aae26c35f5237c822a78f754685e:73e4bf80d8016cb96e3adb660d0e7cb6c1de2bd71600eb8b3ba43ccb8aa1afaa', 1),
('Erik', 'e695aae26c35f5237c822a78f754685e:73e4bf80d8016cb96e3adb660d0e7cb6c1de2bd71600eb8b3ba43ccb8aa1afaa', 0),
('Anna', 'e695aae26c35f5237c822a78f754685e:73e4bf80d8016cb96e3adb660d0e7cb6c1de2bd71600eb8b3ba43ccb8aa1afaa', 0),
('Johan', 'e695aae26c35f5237c822a78f754685e:73e4bf80d8016cb96e3adb660d0e7cb6c1de2bd71600eb8b3ba43ccb8aa1afaa', 0);

-- Demo-turnering
INSERT INTO tournaments (name, status, start_date, active)
VALUES ('Demo-tipset', 'active', '2026-08-20', 1);

-- Lag
INSERT INTO teams (tournament_id, name, group_name)
VALUES
(1, 'Sverige', 'A'),
(1, 'Norge', 'A'),
(1, 'Danmark', 'A'),
(1, 'Finland', 'A');

-- Deltagare
INSERT INTO participants (tournament_id, user_id, role)
VALUES
(1, 1, 'player'),
(1, 2, 'player'),
(1, 3, 'player'),
(1, 4, 'player');

-- Poängregler
INSERT INTO scoring_rules (tournament_id, rule_type, points)
VALUES
(1, 'exact', 3),
(1, 'goal_difference', 2),
(1, 'winner', 1);
