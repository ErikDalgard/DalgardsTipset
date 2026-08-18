import { getCurrentUser } from "../../utils/auth.js";

// GET - Få alla utslagsfrågor för aktiv turnering

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
                prediction_questions.id,
                prediction_questions.tournament_id,
                prediction_questions.label,
                tournaments.start_date,
                prediction_answers.answer_value AS answer
            FROM prediction_questions

            JOIN tournaments
                ON prediction_questions.tournament_id = tournaments.id

            LEFT JOIN prediction_answers
                ON prediction_answers.question_id = prediction_questions.id
                AND prediction_answers.user_id = ?

            WHERE tournaments.active = 1
        `)
        .bind(user.id)
        .all();

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
            "GET /api/user/prediction_questions FEL:",
            err
        );

        return new Response(
            JSON.stringify({
                error: "Kunde inte hämta frågor",
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