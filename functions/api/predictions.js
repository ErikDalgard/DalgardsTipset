import { getCurrentUser } from "../utils/auth.js";

export async function onRequestGet(context) {
  const user = await getCurrentUser(context);
  if (!user) {
    return new Response(JSON.stringify({ error: "Ej inloggad" }), { status: 401 });
  }

  const url = new URL(context.request.url);
  const tournamentId = url.searchParams.get("tournament_id");
  if (!tournamentId) {
    return new Response(JSON.stringify({ error: "tournament_id krävs" }), { status: 400 });
  }

  const { results } = await context.env.DB.prepare(`
    SELECT
      matches.id AS match_id, matches.kickoff_at, matches.deadline_at,
      home.name AS home_team, away.name AS away_team,
      match_predictions.home_score, match_predictions.away_score
    FROM matches
    JOIN teams AS home ON matches.home_team_id = home.id
    JOIN teams AS away ON matches.away_team_id = away.id
    LEFT JOIN match_predictions
      ON match_predictions.match_id = matches.id AND match_predictions.user_id = ?
    WHERE matches.tournament_id = ?
    ORDER BY matches.kickoff_at
  `).bind(user.id, tournamentId).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const user = await getCurrentUser(context);
  if (!user) {
    return new Response(JSON.stringify({ error: "Ej inloggad" }), { status: 401 });
  }

  const { match_id, home_score, away_score } = await context.request.json();
  if (!match_id || home_score === undefined || away_score === undefined) {
    return new Response(JSON.stringify({ error: "match_id, home_score och away_score krävs" }), { status: 400 });
  }

  // Hämta matchens deadline och kontrollera den mot servertid
  const match = await context.env.DB.prepare(
    "SELECT deadline_at FROM matches WHERE id = ?"
  ).bind(match_id).first();

  if (!match) {
    return new Response(JSON.stringify({ error: "Matchen finns inte" }), { status: 404 });
  }

  if (new Date(match.deadline_at) <= new Date()) {
    return new Response(JSON.stringify({ error: "Deadline har passerat, tipset är låst" }), { status: 403 });
  }

  await context.env.DB.prepare(`
    INSERT INTO match_predictions (match_id, user_id, home_score, away_score)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(match_id, user_id) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      submitted_at = datetime('now')
  `).bind(match_id, user.id, home_score, away_score).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}