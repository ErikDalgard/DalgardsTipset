import { getCurrentUser } from "../../utils/auth.js";


// GET RESULTAT
export async function onRequestGet(context) {
  const user = await getCurrentUser(context);

  const matchId = new URL(context.request.url).searchParams.get("match_id");

  if (!matchId) {
    return new Response(
      JSON.stringify({ error: "Match-id krävs" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const { results } = await context.env.DB.prepare(`
    SELECT
      match_id,
      home_score,
      away_score,
      after_extra_time,
      after_penalties,
      winner_team_id
    FROM match_results
    WHERE match_id = ?
  `).bind(matchId).all();

  return new Response(
    JSON.stringify(results[0] || null),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}

// SKAPA / UPPDATERA RESULTAT
export async function onRequestPatch(context) {
  const user = await getCurrentUser(context);

  const {
    match_id,
    home_score,
    away_score,
    after_extra_time,
    after_penalties,
    winner_team_id
  } = await context.request.json();

  if (!match_id) {
    return new Response(
      JSON.stringify({ error: "Match-id krävs" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  if (home_score === undefined || away_score === undefined) {
    return new Response(
      JSON.stringify({ error: "Resultat krävs" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    await context.env.DB.prepare(`
      INSERT INTO match_results (
        match_id,
        home_score,
        away_score,
        after_extra_time,
        after_penalties,
        winner_team_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(match_id)
      DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        after_extra_time = excluded.after_extra_time,
        after_penalties = excluded.after_penalties,
        winner_team_id = excluded.winner_team_id
    `).bind(
      match_id,
      home_score,
      away_score,
      after_extra_time ? 1 : 0,
      after_penalties ? 1 : 0,
      winner_team_id || null
    ).run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({ error: "Kunde inte spara resultatet" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}