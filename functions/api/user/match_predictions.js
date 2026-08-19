import { getCurrentUser } from "../../utils/auth.js";

// GET - få spelares predictions

export async function onRequestGet(context) {
    const user = await getCurrentUser(context);

    const url = new URL(context.request.url);
    const today = url.searchParams.get("today") === "true";

    let results;

    if (today) {
            const response = await context.env.DB.prepare(`
                SELECT
                    users.username,
                    matches.id AS match_id,

                    home_team.name AS home_team,
                    away_team.name AS away_team,

                    matches.kickoff_at,
                    matches.deadline_at,

                    match_results.home_score AS result_home_score,
                    match_results.away_score AS result_away_score,

                    match_predictions.user_id,
                    match_predictions.home_score,
                    match_predictions.away_score

                FROM matches

                JOIN teams AS home_team
                    ON home_team.id = matches.home_team_id

                JOIN teams AS away_team
                    ON away_team.id = matches.away_team_id
                
                LEFT JOIN match_results
                    ON match_results.match_id = matches.id

                LEFT JOIN match_predictions
                    ON match_predictions.match_id = matches.id

                LEFT JOIN users
                    ON users.id = match_predictions.user_id

                WHERE DATE(matches.kickoff_at) = DATE('now', 'localtime')

                ORDER BY matches.kickoff_at
            `).all();

            return new Response(
                JSON.stringify({
                    current_username: user.username, 
                    current_user_id: user.id,
                    matches: response.results
                }),
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
    }

    else {

        const response = await context.env.DB.prepare(`
            SELECT 
                match_predictions.match_id,
                match_predictions.home_score,
                match_predictions.away_score

            FROM match_predictions

            WHERE match_predictions.user_id = ?
        `)
        .bind(user.id)
        .all();

        results = response.results;

        return new Response(
            JSON.stringify(results),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
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