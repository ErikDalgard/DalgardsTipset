import { getCurrentUser } from "../../utils/auth.js";

export async function onRequestPatch(context) {
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

    const { question_id, answer } = await context.request.json();

    if (!question_id || !answer) {
        return new Response(
            JSON.stringify({
                error: "question_id och answer krävs"
            }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    try {
        await context.env.DB.prepare(`
            INSERT INTO prediction_answers (
                question_id,
                user_id,
                answer_value
            )
            VALUES (?, ?, ?)

            ON CONFLICT(question_id, user_id)
            DO UPDATE SET
                answer_value = excluded.answer_value
        `)
        .bind(
            question_id,
            user.id,
            answer
        )
        .run();

        return new Response(
            JSON.stringify({
                success: true
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (err) {
        console.error(
            "PATCH /api/user/prediction_answers FEL:",
            err
        );

        return new Response(
            JSON.stringify({
                error: "Kunde inte spara svaret",
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