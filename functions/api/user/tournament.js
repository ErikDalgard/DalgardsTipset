import { getCurrentUser } from "../../utils/auth.js";

// GET ACTIVE TOURNAMENT
export async function onRequestGet(context) {
    await getCurrentUser(context);

    const { results } = await context.env.DB.prepare(
        "SELECT id, name, start_date FROM tournaments WHERE active = 1 LIMIT 1"
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