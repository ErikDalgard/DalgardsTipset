export async function onRequestPost(context) {
  const { env, request } = context;

  // Läs ut sessionstoken från cookien, samma sätt som getCurrentUser gör
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);

  if (match) {
    const token = match[1];
    // Ta bort sessionen ur databasen så token slutar fungera helt
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }

    // Skicka en cookie med Max-Age=0 -> webbläsaren tar bort den direkt
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0"
    }
  });
}