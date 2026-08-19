import { getCurrentUser } from "../../utils/auth.js";

// GET - hämta alla matcher vid den aktiva turneringen
// Query parameter coming_games hämtar de nästa x otippade matcherna
export async function onRequestGet(context) {
    const user = await getCurrentUser(context);

    const url = new URL(context.request.url);
    const coming_games = url.searchParams.get("coming_games");

    let query = `
        SELECT 
            matches.id,
            matches.kickoff_at, 
            matches.deadline_at,
            home_team.name AS home_team, 
            away_team.name AS away_team

        FROM matches

        JOIN tournaments
            ON matches.tournament_id = tournaments.id

        JOIN teams AS home_team
            ON matches.home_team_id = home_team.id

        JOIN teams AS away_team
            ON matches.away_team_id = away_team.id
    `;

    let results;

    if (coming_games !== null) {

        query += `
            LEFT JOIN match_predictions
                ON match_predictions.match_id = matches.id
                AND match_predictions.user_id = ?

            WHERE tournaments.active = 1
                AND matches.kickoff_at >= CURRENT_TIMESTAMP
                AND match_predictions.match_id IS NULL

            ORDER BY matches.kickoff_at ASC
            LIMIT ?
        `;

        ({ results } = await context.env.DB
            .prepare(query)
            .bind(user.id, Number(coming_games))
            .all());

    } else {

        query += `
            WHERE tournaments.active = 1
            ORDER BY matches.kickoff_at ASC
        `;

        ({ results } = await context.env.DB
            .prepare(query)
            .all());
    }

    return new Response(
        JSON.stringify(results),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}