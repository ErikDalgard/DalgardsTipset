import { hashPassword } from "../../utils/password.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Användarnamn och lösenord krävs" }), { status: 400 });
  }

  const password_hash = await hashPassword(password);

  try {
    await env.DB.prepare(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)"
    ).bind(username, password_hash).run();
  } catch (e) {
    // UNIQUE constraint på username slår till om namnet redan finns
    return new Response(JSON.stringify({ error: "Användarnamnet är upptaget" }), { status: 409 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}