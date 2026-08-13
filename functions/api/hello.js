export async function onRequest(context) {
  return new Response(JSON.stringify({ message: "Backend fungerar!" }), {
    headers: { "Content-Type": "application/json" }
  });
}