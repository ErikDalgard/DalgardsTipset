import { requireAdmin } from "../../utils/auth.js";


// GET: hämta poängreglerna för en turnering
export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const url = new URL(context.request.url);
  const tournamentId = url.searchParams.get("tournament_id");

  const { results } = await context.env.DB.prepare(
    "SELECT rule_type, points FROM scoring_rules WHERE tournament_id = ?"
  ).bind(tournamentId).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}

// POST: uppdaterar en regel i taget 
export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { tournament_id, rule_type, points } = await context.request.json();


  if (!tournament_id || points === undefined) {
    return new Response(JSON.stringify({ error: "tournament_id och points krävs" }), { status: 400 });
  }

  await context.env.DB.prepare(`
    INSERT INTO scoring_rules (tournament_id, rule_type, points)
    VALUES (?, ?, ?)
    ON CONFLICT (tournament_id, rule_type) DO UPDATE SET
    points = excluded.points
    `).bind(tournament_id, rule_type, points).run(); 

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}