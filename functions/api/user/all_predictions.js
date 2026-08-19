import { getCurrentUser } from "../../utils/auth.js";

// GET - Hämta alla tips för aktiv turnering
export async function onRequestGet(context) {
  const user = await getCurrentUser(context);

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Inte inloggad" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const { results } = await context.env.DB.prepare(`
      SELECT
        m.id AS match_id,
        m.kickoff_at,
        m.deadline_at,
        m.status,

        home.name AS home_team,
        away.name AS away_team,

        mr.home_score AS result_home_score,
        mr.away_score AS result_away_score,

        u.id AS user_id,
        u.username,

        mp.home_score,
        mp.away_score,
        mp.points

      FROM matches m

      JOIN tournaments t
        ON m.tournament_id = t.id

      JOIN teams home
        ON m.home_team_id = home.id

      JOIN teams away
        ON m.away_team_id = away.id

      LEFT JOIN match_results mr
        ON mr.match_id = m.id

      JOIN participants p
        ON p.tournament_id = t.id

      JOIN users u
        ON u.id = p.user_id

      LEFT JOIN match_predictions mp
        ON mp.match_id = m.id
        AND mp.user_id = u.id

      WHERE t.active = 1

      ORDER BY
        m.kickoff_at ASC,
        u.username ASC
    `).all();

    return new Response(
      JSON.stringify({
        current_user_id: user.id,
        predictions: results
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    console.error("GET /api/user/all_predictions FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte hämta alla tips",
        details: err.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}