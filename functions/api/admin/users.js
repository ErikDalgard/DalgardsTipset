import { requireAdmin } from "../../utils/auth.js";
import { hashPassword } from "../../utils/password.js";

// GET FUNKTION, RETURNERA ALLA ANVÄNDARE
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

// POST FUNKTION, LÄGG TILL ANVÄNDARE
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

// PATCH FUNKTION, UPPDATERA EN ANVÄNDARE
export async function onRequestPatch(context){
  const {error} = await (requireAdmin(context));
  if (error) return error;

  const {id, username, password, is_admin} = await context.request.json();

   //uppdatera lösenord
  if (password != ""){
    const password_hash = await hashPassword(password);

    await context.env.DB.prepare(
      "UPDATE users SET username = ?, password_hash = ?, is_admin = ? WHERE id = ?"
    ).bind(username, password_hash, is_admin ? 1: 0, id).run();
  }

  //Om inte kör på utan
  else{
    await context.env.DB.prepare(
      "UPDATE users SET username = ?, is_admin = ? WHERE id = ?"
    ).bind(username, is_admin ? 1 : 0, id).run();
  }


  return new Response(JSON.stringify({success: true}), {headers: {"Content-Type": "application/json"}});

}

// DELETE FUNKTION, RADERA EN ANVÄNDARE

export async function onRequestDelete(context){
  const {error} = await (requireAdmin(context));
  if (error) return error;

  const {id} = await context.request.json();

  if (!id){
    return new Response(
      JSON.stringify({error: "Användar-id krävs"}),{
        status: 400,
        headers: {"Content-Type": "application/json"}
      }
    );
  }

  try {
    await context.env.DB.prepare(
      "DELETE FROM users WHERE id = ?"
    ).bind(id).run();
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {"Content-Type": "application/json"}
      }
    );

  }
  catch(e){
    return new Response(
      JSON.stringify({ error: "Kunde inte radera användaren"}),
      {
        status: 500,
        headers: {"Content-Type": "application/json"}
      }
    );
  }
}