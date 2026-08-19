import { requireAdmin } from "../../utils/auth.js";

// GET - Hämta alla användare och vilka som deltar i turneringen
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
        users.id,
        users.username,
        CASE
          WHEN participants.user_id IS NOT NULL THEN 1
          ELSE 0
        END AS participant
      FROM users

      LEFT JOIN participants
        ON participants.user_id = users.id
        AND participants.tournament_id = ?

      ORDER BY users.username
    `)
      .bind(tournamentId)
      .all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("GET /api/admin/tournament_participants FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte hämta deltagare",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}


// POST - Lägg till användare i turneringen
export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const {
    tournament_id,
    user_id
  } = await context.request.json();

  if (!tournament_id || !user_id) {
    return new Response(
      JSON.stringify({
        error: "tournament_id och user_id krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    await context.env.DB.prepare(`
      INSERT INTO participants (
        tournament_id,
        user_id,
        role
      )
      VALUES (?, ?, 'player')
      ON CONFLICT(tournament_id, user_id) DO NOTHING
    `)
      .bind(tournament_id, user_id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        tournament_id,
        user_id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("POST /api/admin/tournament_participants FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte lägga till deltagare",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}


// DELETE - Ta bort användare från turneringen
export async function onRequestDelete(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const {
    tournament_id,
    user_id
  } = await context.request.json();

  if (!tournament_id || !user_id) {
    return new Response(
      JSON.stringify({
        error: "tournament_id och user_id krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    await context.env.DB.prepare(`
      DELETE FROM participants
      WHERE tournament_id = ?
      AND user_id = ?
    `)
      .bind(tournament_id, user_id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        tournament_id,
        user_id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("DELETE /api/admin/tournament_participants FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte ta bort deltagare",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}