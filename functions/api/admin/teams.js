import { requireAdmin } from "../../utils/auth.js";

export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const url = new URL(context.request.url);
  const tournamentId = url.searchParams.get("tournament_id");

  if (!tournamentId) {
    return new Response(JSON.stringify({ error: "tournament_id krävs" }), { status: 400 });
  }

  const { results } = await context.env.DB.prepare(
    "SELECT id, name, group_name FROM teams WHERE tournament_id = ? ORDER BY group_name, name"
  ).bind(tournamentId).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { tournament_id, name, group_name } = await context.request.json();
  if (!tournament_id || !name) {
    return new Response(JSON.stringify({ error: "tournament_id och name krävs" }), { status: 400 });
  }

  const result = await context.env.DB.prepare(
    "INSERT INTO teams (tournament_id, name, group_name) VALUES (?, ?, ?)"
  ).bind(tournament_id, name, group_name || null).run();

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
    headers: { "Content-Type": "application/json" }
  });
}