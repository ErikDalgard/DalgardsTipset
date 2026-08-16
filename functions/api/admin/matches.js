import { requireAdmin } from "../../utils/auth.js";

export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const url = new URL(context.request.url);
  const tournamentId = url.searchParams.get("tournament_id");

  if (!tournamentId) {
    return new Response(
      JSON.stringify({ error: "tournament_id krävs" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const { results } = await context.env.DB.prepare(`
      SELECT
        matches.id,
        matches.kickoff_at,
        matches.deadline_at,
        matches.stage,
        matches.status,
        home.name AS home_team,
        away.name AS away_team
      FROM matches
      JOIN teams AS home ON matches.home_team_id = home.id
      JOIN teams AS away ON matches.away_team_id = away.id
      WHERE matches.tournament_id = ?
      ORDER BY matches.kickoff_at
    `)
      .bind(tournamentId)
      .all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("GET /api/admin/matches FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte hämta matcher",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}