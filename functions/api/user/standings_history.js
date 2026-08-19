import { getCurrentUser } from "../../utils/auth.js";

// GET - Hämta poängutveckling för aktiv turnering

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
                m.kickoff_at AS date,
                u.id AS user_id,
                u.username,

                COALESCE((
                    SELECT SUM(mp.points)
                    FROM match_predictions mp
                    JOIN matches pm
                        ON pm.id = mp.match_id
                    WHERE mp.user_id = u.id
                    AND pm.tournament_id = m.tournament_id
                    AND pm.kickoff_at <= m.kickoff_at
                ), 0)

                +

                CASE
                    WHEN DATE(m.kickoff_at) = (
                        SELECT DATE(MAX(last_match.kickoff_at))
                        FROM matches last_match
                        WHERE last_match.tournament_id = m.tournament_id
                    )
                    THEN COALESCE((
                        SELECT SUM(pa.points)
                        FROM prediction_answers pa
                        JOIN prediction_questions pq
                            ON pq.id = pa.question_id
                        WHERE pa.user_id = u.id
                        AND pq.tournament_id = m.tournament_id
                    ), 0)
                    ELSE 0
                END AS points

            FROM matches m

            JOIN tournaments t
                ON t.id = m.tournament_id

            JOIN participants tp
                ON tp.tournament_id = t.id

            JOIN users u
                ON u.id = tp.user_id

            WHERE t.active = 1

            ORDER BY m.kickoff_at, u.username
        `).all();

        return new Response(
            JSON.stringify(results),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (err) {
        console.error(
            "GET /api/user/standings_history FEL:",
            err
        );

        return new Response(
            JSON.stringify({
                error: "Kunde inte hämta poänghistorik",
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