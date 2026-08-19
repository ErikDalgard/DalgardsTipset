import { requireAdmin } from "../../utils/auth.js";


// GET RESULTAT
export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

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
  const { error } = await requireAdmin(context);
  if (error) return error;

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


    // Ta reda på vilken turnering matchen tillhör, för att hämta rätt regler
    const match = await context.env.DB.prepare(
      "SELECT tournament_id FROM matches WHERE id = ?"
    ).bind(match_id).first();

    const rules = await getRulesasObject(context.env.DB, match.tournament_id);

    // Hämta alla tips på matchen
    const { results: predictions } = await context.env.DB.prepare(
      "SELECT id, home_score, away_score FROM match_predictions WHERE match_id = ?"
    ).bind(match_id).all();

    // Räkna ut och spara poäng för varje tips
    for (const prediction of predictions) {
      const points = calculateMatchPoints(
        prediction,
        { home_score, away_score },
        rules
      );

      await context.env.DB.prepare(
        "UPDATE match_predictions SET points = ? WHERE id = ?"
      ).bind(points, prediction.id).run();
    }

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

// funktion för att beräkna poäng mellan prediction och det faktiska resultatet
function calculateMatchPoints(prediction, actual, rules) {
  const predDiff = prediction.home_score - prediction.away_score;
  const actualDiff = actual.home_score - actual.away_score;

  const isExact = prediction.home_score === actual.home_score && prediction.away_score === actual.away_score;
  if (isExact) return rules.exact_score ?? 0;

  if (predDiff === actualDiff) return rules.correct_diff ?? 0;

  if (Math.sign(predDiff) === Math.sign(actualDiff)) return rules.correct_winner ?? 0;

  return 0;
}

//hämtar scoring rules för turnering och bygger om till enkelt objekt för att kunna slå upp värden ur enklare
async function getRulesasObject(db, tournamentId){
  const {results} = await db.prepare(
    "SELECT rule_type, points FROM scoring_rules WHERE tournament_id = ?"
  ).bind(tournamentId).all();

  const rules = {};

  for (const row of results){
    rules[row.rule_type] = row.points;
  }
  return rules
}

