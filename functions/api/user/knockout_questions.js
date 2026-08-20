import { getCurrentUser } from "../../utils/auth.js";

// GET - Hämta alla tips för aktiv turnering
export async function onRequestGet(context) {
  const user = await getCurrentUser(context);

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Inte inloggad" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const { results } = await context.env.DB.prepare(`
      SELECT
          pq.id AS question_id,
          pq.label AS question,
          pq.points AS question_points,
          qr.correct_answer_value AS correct_answer,

          u.id AS user_id,
          u.username,

          pa.answer_value AS prediction,
          pa.points AS earned_points,

          t.start_date

      FROM prediction_questions pq

      JOIN tournaments t
          ON pq.tournament_id = t.id

      JOIN participants p
          ON p.tournament_id = t.id

      JOIN users u
          ON u.id = p.user_id

      LEFT JOIN prediction_answers pa
          ON pa.question_id = pq.id
          AND pa.user_id = u.id

      LEFT JOIN question_results qr
          ON qr.question_id = pq.id

      WHERE t.active = 1

      ORDER BY
          pq.id ASC,
          u.username ASC;
    `).all();

    return new Response(
      JSON.stringify(results),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error(
      "GET /api/user/knockout_questions FEL:",
      error
    );

    return new Response(
      JSON.stringify({
        error: "Kunde inte hämta alla tips",
        details: error.message
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