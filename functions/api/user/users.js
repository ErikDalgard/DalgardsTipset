import { getCurrentUser } from "../../utils/auth.js";

export async function onRequestGet(context) {
    // Valfritt: Kontrollera att användaren är inloggad
    await getCurrentUser(context);

    const response = await context.env.DB.prepare(`
        SELECT id, username 
        FROM users 
        ORDER BY username
    `).all();

    return new Response(
        JSON.stringify(response.results),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}