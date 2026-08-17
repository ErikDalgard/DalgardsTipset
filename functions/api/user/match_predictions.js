import { getCurrentUser } from "../../utils/auth.js";

// GET - få spelares predictions

export async function onRequestGet(context){
    const user = await getCurrentUser(context);

    const {results} = await context.env.DB.prepare(`
        SELECT 
            match_predictions.match_id,
            match_predictions.home_score,
            match_predictions.away_score
        
        FROM match_predictions
        WHERE match_predictions.user_id = ?
        `).bind(user.id).all();
        return new Response(
            JSON.stringify(results),
            {headers: {"Content-Type": "applications/json"}}
        );
}

//PATCH - uppdatera/sätt ett tips

export async function onRequestPatch(context) {
    const user = await getCurrentUser(context);

    const { match_id, home_score, away_score } = await context.request.json();

    if (
        match_id === undefined ||
        home_score === undefined ||
        away_score === undefined
    ) {
        return new Response(
            JSON.stringify({
                error: "Match-id och resultat krävs"
            }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    const match = await context.env.DB.prepare(`
        SELECT id, deadline_at
        FROM matches
        WHERE id = ?
    `).bind(match_id).first();

    if (!match) {
        return new Response(
            JSON.stringify({
                error: "Matchen finns inte"
            }),
            {
                status: 404,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    if (new Date() >= new Date(match.deadline_at)) {
        return new Response(
            JSON.stringify({
                error: "Deadline för matchen har passerat"
            }),
            {
                status: 403,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    await context.env.DB.prepare(`
        INSERT INTO match_predictions (
            user_id,
            match_id,
            home_score,
            away_score
        )
        VALUES (?, ?, ?, ?)

        ON CONFLICT(user_id, match_id)
        DO UPDATE SET
            home_score = excluded.home_score,
            away_score = excluded.away_score
    `)
    .bind(
        user.id,
        match_id,
        home_score,
        away_score
    )
    .run();

    return new Response(
        JSON.stringify({ success: true }),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}