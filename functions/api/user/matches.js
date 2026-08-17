import { getCurrentUser } from "../../utils/auth.js";

// GET - hämta alla matcher vid den aktiva turneringen
export async function onRequestGet(context) {
    await getCurrentUser(context);

    const { results } = await context.env.DB.prepare(
        `
        SELECT 
            matches.id,
            matches.kickoff_at, 
            matches.deadline_at,
            home_team.name AS home_team, 
            away_team.name AS away_team
        FROM matches
        JOIN tournaments
            on matches.tournament_id = tournaments.id
        JOIN teams AS home_team
            ON matches.home_team_id = home_team.id
        JOIN teams AS away_team
            ON matches.away_team_id = away_team.id
        WHERE tournaments.active = 1
        ORDER BY matches.kickoff_at ASC
        `
    ).all();

    return new Response(
        JSON.stringify(results),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}

