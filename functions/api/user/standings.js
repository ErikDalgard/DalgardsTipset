import { getCurrentUser } from "../../utils/auth.js";

// GET - Hämta ställningen för aktiv turnering

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
                users.id,
                users.username,

                COALESCE((
                    SELECT SUM(mp.points)
                    FROM match_predictions mp
                    JOIN matches m
                        ON mp.match_id = m.id
                    WHERE mp.user_id = users.id
                    AND m.tournament_id = tournaments.id
                ), 0)

                +

                COALESCE((
                    SELECT SUM(pa.points)
                    FROM prediction_answers pa
                    JOIN prediction_questions pq
                        ON pa.question_id = pq.id
                    WHERE pa.user_id = users.id
                    AND pq.tournament_id = tournaments.id
                ), 0) AS points

            FROM participants

            JOIN users
                ON participants.user_id = users.id

            JOIN tournaments
                ON participants.tournament_id = tournaments.id

            WHERE tournaments.active = 1

            ORDER BY points DESC
        `).all();

        return new Response(
            JSON.stringify({
                current_user_id: user.id,
                standings: results}),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (err) {
        console.error("GET /api/standings FEL:", err);

        return new Response(
            JSON.stringify({
                error: "Kunde inte hämta ställningen",
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