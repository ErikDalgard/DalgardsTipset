export async function onRequest(context) {
  const { env } = context;

  const { results } = await env.DB.prepare(
    "SELECT id, name, group_name FROM teams ORDER BY group_name, name"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}