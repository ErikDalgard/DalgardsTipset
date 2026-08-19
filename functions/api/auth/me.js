import { getCurrentUser } from "../../utils/auth.js";

export async function onRequestGet(context) {
  const user = await getCurrentUser(context);
  if (!user) {
    return new Response(JSON.stringify({ error: "Ej inloggad" }), { status: 401 });
  }
  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" }
  });
}