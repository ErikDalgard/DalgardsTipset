import { requireAdmin } from "../../utils/auth.js";

export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { results } = await context.env.DB.prepare(
    "SELECT id, name, status, start_date FROM tournaments ORDER BY id DESC"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { name, start_date } = await context.request.json();
  if (!name) {
    return new Response(JSON.stringify({ error: "Namn krävs" }), { status: 400 });
  }

  const result = await context.env.DB.prepare(
    "INSERT INTO tournaments (name, status, start_date) VALUES (?, 'upcoming', ?)"
  ).bind(name, start_date || null).run();

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
    headers: { "Content-Type": "application/json" }
  });
}