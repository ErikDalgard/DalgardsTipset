import { requireAdmin } from "../../utils/auth.js";
import { hashPassword } from "../../utils/password.js";

export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { results } = await context.env.DB.prepare(
    "SELECT id, username, is_admin, created_at FROM users ORDER BY username"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { username, password, is_admin } = await context.request.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Användarnamn och lösenord krävs" }), { status: 400 });
  }

  const password_hash = await hashPassword(password);

  try {
    const result = await context.env.DB.prepare(
      "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)"
    ).bind(username, password_hash, is_admin ? 1 : 0).run();

    return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Användarnamnet är upptaget" }), { status: 409 });
  }
}