export async function onRequestGet(context) {
  const admin = await context.env.DB.prepare(
    "SELECT username FROM users WHERE is_admin = 1 LIMIT 1"
  ).first();

  return new Response(JSON.stringify({ username: admin?.username || null }), {
    headers: { "Content-Type": "application/json" }
  });
}