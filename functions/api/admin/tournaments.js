import { requireAdmin } from "../../utils/auth.js";

export async function onRequestGet(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { results } = await context.env.DB.prepare(
    "SELECT id, name, start_date, active FROM tournaments ORDER BY start_date DESC"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { name, start_date, active} = await context.request.json();
  if (!name) {
    return new Response(JSON.stringify({ error: "Namn krävs" }), { status: 400 });
}

  // om den nya är aktiv så sätt alla andra till passiva
  if (active === 1){
    await context.env.DB.prepare("UPDATE tournaments SET active = 0").run();  
  }


  const result = await context.env.DB.prepare(
    "INSERT INTO tournaments (name, start_date, active) VALUES (?, ?, ?)"
  ).bind(name, start_date, active || 0).run();

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
    headers: { "Content-Type": "application/json" }
  });
}


export async function onRequestPatch(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { id, name, start_date, active } = await context.request.json();

  // Bara en turnering får vara aktiv.
  if (active === 1){
    await context.env.DB.prepare("UPDATE tournaments SET active = 0").run();  
  }

  if (!id) {
    return new Response(
      JSON.stringify({ error: "Turnerings-id krävs" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  if (!name) {
    return new Response(
      JSON.stringify({ error: "Namn krävs" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    await context.env.DB.prepare(
      "UPDATE tournaments SET name = ?, start_date = ?, active = ? WHERE id = ?"
    ).bind(
      name,
      start_date || null,
      active,
      id
    ).run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Kunde inte uppdatera turneringen" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}


// DELETE FUNKTION, RADERA EN TURNERING
export async function onRequestDelete(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { id } = await context.request.json();

  if (!id) {
    return new Response(
      JSON.stringify({ error: "Turnerings-id krävs" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    await context.env.DB.prepare(
      "DELETE FROM tournaments WHERE id = ?"
    ).bind(id).run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (e) {
    console.error("DELETE tournament error:", e);
    return new Response(
      JSON.stringify({ error: "Kunde inte radera turneringen" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}