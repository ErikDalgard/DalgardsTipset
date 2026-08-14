import { requireAdmin } from "../../utils/auth.js";

export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const url = new URL(context.request.url);
  const tournamentId = url.searchParams.get("tournament_id");

  if (!tournamentId) {
    return new Response(JSON.stringify({ error: "tournament_id krävs" }), { status: 400 });
  }

  const { results } = await context.env.DB.prepare(`
    SELECT
      matches.id, matches.kickoff_at, matches.deadline_at, matches.stage, matches.status,
      home.name AS home_team, away.name AS away_team
    FROM matches
    JOIN teams AS home ON matches.home_team_id = home.id
    JOIN teams AS away ON matches.away_team_id = away.id
    WHERE matches.tournament_id = ?
    ORDER BY matches.kickoff_at
  `).bind(tournamentId).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { tournament_id, home_team_id, away_team_id, kickoff_at, deadline_at } = await context.request.json();

  if (!tournament_id || !home_team_id || !away_team_id || !kickoff_at) {
    return new Response(JSON.stringify({ error: "Alla fält utom deadline krävs" }), { status: 400 });
  }

  // Om ingen deadline angetts: räkna ut den automatiskt som 1h före kickoff
  const finalDeadline = deadline_at || new Date(new Date(kickoff_at).getTime() - 60 * 60 * 1000).toISOString();

  const result = await context.env.DB.prepare(
    `INSERT INTO matches (tournament_id, home_team_id, away_team_id, kickoff_at, deadline_at, stage)
     VALUES (?, ?, ?, ?, ?, 'group')`
  ).bind(tournament_id, home_team_id, away_team_id, kickoff_at, finalDeadline).run();

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
    headers: { "Content-Type": "application/json" }
  });
}