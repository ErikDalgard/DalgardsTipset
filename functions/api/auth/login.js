import { verifyPassword } from "../../utils/password.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  const { username, password } = await request.json();

  const user = await env.DB.prepare(
    "SELECT id, password_hash FROM users WHERE username = ?"
  ).bind(username).first();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return new Response(JSON.stringify({ error: "Fel användarnamn eller lösenord" }), { status: 401 });
  }

  const token = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id) VALUES (?, ?)"
  ).bind(token, user.id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=2592000`
    }
  });
}