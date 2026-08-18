import { requireAdmin } from "../../utils/auth.js";

// GET - Få alla svar

export async function onRequestGet(context){
    const {error} = await requireAdmin(context)

    if (error) return error;

    const url = new URL(context.request.url);
    const question_id = url.searchParams.get("question_id")

    if (!question_id){
        return new Response(
            JSON.stringify({error: "question_id krävs"}),
            {
            status: 400,
            headers: { "Content-Type": "application/Json"}
            }
        )
    }

    try {
    const {results} = await context.env.DB.prepare(`
        SELECT 
            correct_answer_value
        FROM 
            question_results
        WHERE 
            question_id = ?
        `).bind(question_id).all();

        return new Response(JSON.stringify(results), {
            headers: {"Content-Type": "application/json"}
        });
    }



    catch (err){

    console.error("GET /api/admin/predictions_questions FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte hämta svar",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
    }
}

// POST - lägga till ett svar!
export async function onRequestPost(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const {
    question_id,
    correct_answer_value
  } = await context.request.json();

  if (!question_id || !correct_answer_value) {
    return new Response(
      JSON.stringify({
        error: "question_id,  correct_answer_value krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const result = await context.env.DB.prepare(`
      INSERT INTO question_results (
        question_id,
        correct_answer_value
      )
      VALUES (?, ?)
    `)
      .bind(question_id,correct_answer_value).run();

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
        error: "Kunde inte skapa svar",
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
    question_id,
    correct_answer_value
  } = await context.request.json();

  if (!question_id || !correct_answer_value) {
    return new Response(
      JSON.stringify({
        error: "question_id och correct_answer_value krävs"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const result = await context.env.DB.prepare(`
        UPDATE question_results
        SET
            correct_answer_value = ?
        WHERE 
            question_id = ?

    `)
      .bind(correct_answer_value,question_id).run();

    return new Response(
      JSON.stringify({
        success: true,
        question_id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("PATCH /api/admin/question_results FEL:", err);

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

  const {question_id} = await context.request.json();

  if (!question_id) {
    return new Response(
      JSON.stringify({
        error: "question_id krävs"
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
            question_results
        WHERE
            question_id = ?
    `)
      .bind(question_id).run();

    return new Response(
      JSON.stringify({
        success: true,
        question_id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("DELETE /api/admin/question_id FEL:", err);

    return new Response(
      JSON.stringify({
        error: "Kunde inte radera svaret",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}