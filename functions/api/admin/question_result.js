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

    // Räkna om poäng för alla svar på frågan nu när facit är satt
    await calculateAndSaveQuestionPoints(context.env.DB, question_id, correct_answer_value);

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


// PATCH - skapa eller uppdatera rätt svar
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
        await context.env.DB.prepare(`
            INSERT INTO question_results (
                question_id,
                correct_answer_value
            )
            VALUES (?, ?)
            ON CONFLICT(question_id)
            DO UPDATE SET
                correct_answer_value = excluded.correct_answer_value
        `)
        .bind(question_id, correct_answer_value)
        .run();

        await calculateAndSaveQuestionPoints(
            context.env.DB,
            question_id,
            correct_answer_value
        );

        return new Response(
            JSON.stringify({
                success: true,
                question_id: question_id,
                correct_answer_value: correct_answer_value
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        );

    } catch (err) {
        console.error(
            "PATCH /api/admin/question_result FEL:",
            err
        );

        return new Response(
            JSON.stringify({
                error: "Kunde inte spara rätt svar",
                details: err.message
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

// DELETE - ta bort facit för en fråga och återställ poängen
export async function onRequestDelete(context) {
  const { error } = await requireAdmin(context);
  if (error) return error;

  const { question_id } = await context.request.json();

  if (!question_id) {
    return new Response(
      JSON.stringify({
        error: "question_id krävs"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    // Ta bort facit
    const result = await context.env.DB.prepare(`
      DELETE FROM question_results
      WHERE question_id = ?
    `)
      .bind(question_id)
      .run();

    // Återställ poängen för alla svar på frågan
    await context.env.DB.prepare(`
      UPDATE prediction_answers
      SET points = NULL
      WHERE question_id = ?
    `)
      .bind(question_id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        question_id,
        deleted: result.meta.changes > 0
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    console.error(
      "DELETE /api/admin/prediction_question FEL:",
      err
    );

    return new Response(
      JSON.stringify({
        error: "Kunde inte radera svaret",
        details: err.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
//hjälpfunktion
async function calculateAndSaveQuestionPoints(db, question_id, correct_answer_value) {
  // Hämta frågans poängvärde
  const question = await db.prepare(
    "SELECT points FROM prediction_questions WHERE id = ?"
  ).bind(question_id).first();

  // Hämta alla svar på frågan
  const { results: answers } = await db.prepare(
    "SELECT id, answer_value FROM prediction_answers WHERE question_id = ?"
  ).bind(question_id).all();

  // Rätt svar ger frågans poängvärde, fel svar ger 0
  for (const answer of answers) {
    const points = answer.answer_value === correct_answer_value
      ? question.points
      : 0;

    await db.prepare(
      "UPDATE prediction_answers SET points = ? WHERE id = ?"
    ).bind(points, answer.id).run();
  }
}