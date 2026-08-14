export async function getCurrentUser(context) {
  const { env, request } = context;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  const result = await env.DB.prepare(
    `SELECT users.id, users.username, users.is_admin
     FROM sessions JOIN users ON sessions.user_id = users.id
     WHERE sessions.token = ?`
  ).bind(token).first();

  return result || null;
}

export async function requireAdmin(context) {
  const user = await getCurrentUser(context);
  if (!user || !user.is_admin) {
    return { user: null, error: new Response(JSON.stringify({ error: "Kräver adminbehörighet" }), { status: 403 }) };
  }
  return { user, error: null };
}