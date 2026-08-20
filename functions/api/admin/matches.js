import { requireAdmin } from "../../utils/auth.js";

//GET - FÅ ALLA MATCHER
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
        matches.home_team_id,
        matches.away_team_id,
        matches.kickoff_at,
        matches.deadline_at,
        matches.stage,
        matches.status,

        home.name AS home_team,
        away.name AS away_team,

        match_results.home_score,
        match_results.away_score,
        match_results.winner_team_id

      FROM matches

      JOIN teams AS home
        ON matches.home_team_id = home.id

      JOIN teams AS away
        ON matches.away_team_id = away.id

      LEFT JOIN match_results
        ON matches.id = match_results.match_id

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

// POST - LÄGG TILL EN MATCH
export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const {
    tournament_id,
    home_team_id,
    away_team_id,
    kickoff_at
  } = await context.request.json();

  if (!tournament_id || !home_team_id || !away_team_id || !kickoff_at) {
    return new Response(
      JSON.stringify({
        error: "tournament_id, home_team_id, away_team_id och kickoff_at krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const kickoff = new Date(kickoff_at);
  const deadline = new Date(kickoff.getTime() - 60*60*1000);

  try {
    const result = await context.env.DB.prepare(`
      INSERT INTO matches (
        tournament_id,
        home_team_id,
        away_team_id,
        kickoff_at,
        deadline_at
      )
      VALUES (?, ?, ?, ?, ?)
    `)
      .bind(
        tournament_id,
        home_team_id,
        away_team_id,
        kickoff.toISOString(),
        deadline.toISOString()
      )
      .run();

    return new Response(
      JSON.stringify({
        id: result.meta.last_row_id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("POST /api/admin/matches FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte skapa match",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// PATCH - ÄNDRA EN MATCH
export async function onRequestPatch(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { id, home_team_id, away_team_id, kickoff_at } =
    await context.request.json();

  if (!id || !home_team_id || !away_team_id || !kickoff_at) {
    return new Response(
      JSON.stringify({
        error: "id, home_team_id, away_team_id och kickoff_at krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const kickoff = new Date(kickoff_at);
  const deadline = new Date(kickoff.getTime() - 60 * 60 * 1000);

  try {
    await context.env.DB.prepare(`
      UPDATE matches
      SET
        home_team_id = ?,
        away_team_id = ?,
        kickoff_at = ?,
        deadline_at = ?
      WHERE id = ?
    `)
      .bind(
        home_team_id,
        away_team_id,
        kickoff.toISOString(),
        deadline.toISOString(),
        id
      )
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("PATCH /api/admin/matches FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte uppdatera match",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

//DELETE: TA BORT EN MATCH

export async function onRequestDelete(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  try {
    const { id } = await context.request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "id krävs" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    await context.env.DB.prepare(
      "DELETE FROM matches WHERE id = ?"
    )
      .bind(id)
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("DELETE /api/admin/matches FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte radera match",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}