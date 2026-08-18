import { requireAdmin } from "../../utils/auth.js";

// GET - Få alla utslagsfrågor

export async function onRequestGet(context){
    const {error} = await requireAdmin(context)

    if (error) return error;

    const url = new URL(context.request.url);
    const tournamentId = url.searchParams.get("tournament_id")

    if (!tournamentId){
        return new Response(
            JSON.stringify({error: "tournament_id krävs"}),
            {
            status: 400,
            headers: { "Content-Type": "application/Json"}
            }
        )
    }

    try {
    const {results} = await context.env.DB.prepare(`
        SELECT 
            id,
            tournament_id,
            label,
            type
        FROM 
            prediction_questions
        WHERE 
            tournament_id = ?
        `).bind(tournamentId).all();

        return new Response(JSON.stringify(results), {
            headers: {"Content-Type": "application/json"}
        });
    }



    catch (err){

    console.error("GET /api/admin/predictions_questions FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte hämta frågor",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
    }
}

// POST - lägga till en fråga!
export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const {
    tournament_id,
    label,
    type,
  } = await context.request.json();

  if (!tournament_id || !label || !type) {
    return new Response(
      JSON.stringify({
        error: "tournament_id, label, type krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const result = await context.env.DB.prepare(`
      INSERT INTO prediction_questions (
        tournament_id,
        label,
        type
      )
      VALUES (?, ?, ?)
    `)
      .bind(tournament_id,label,type).run();

    return new Response(
      JSON.stringify({
        id: result.meta.last_row_id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("POST /api/admin/prediction_questions FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte skapa fråga",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}


// PATCH - uppdatera  en fråga!
export async function onRequestPatch(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const {
    id,
    tournament_id,
    label,
    type,
  } = await context.request.json();

  if (!id || !tournament_id || !label || !type) {
    return new Response(
      JSON.stringify({
        error: "id, tournament_id, label, type krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const result = await context.env.DB.prepare(`
        UPDATE prediction_questions
        SET
            tournament_id = ?,
            label = ?,
            type = ?
        WHERE id = ?

    `)
      .bind(tournament_id,label,type, id).run();

    return new Response(
      JSON.stringify({
        success: true,
        id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("PATCH /api/admin/prediction_questions FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte uppdatera fråga",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// Delete - ta bort  en fråga!
export async function onRequestDelete(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const {id} = await context.request.json();

  if (!id) {
    return new Response(
      JSON.stringify({
        error: "id krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const result = await context.env.DB.prepare(`
        DELETE 
        FROM 
            prediction_questions
        WHERE
            id = ?
    `)
      .bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("DELETE /api/admin/prediction_questions FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte radera frågan",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}