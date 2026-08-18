
import { setupToggleCard, hideCard } from "./ui.js";

// --- Utslagsfrågor ---

let editingQuestionsId = null;

export async function setupQuestionManagement() {

    //ladda frågor
    loadQuestions();

    //Ändras turneringen ska frågorna laddas om
    document.getElementById("tournament-select").addEventListener("change", async () => {
        await loadQuestions();
    });




    //Gå in i lägg till fråge mode
    document.getElementById("btn-edit-question").addEventListener("click", () => {
        editingQuestionsId = null;

        document.getElementById("question-list-card").hidden = false;
        document.getElementById("btn-edit-question").hidden = true;
        document.getElementById("cancel-card-question-layout").hidden = false;

        // Dölj radera eftersom vi skapar en ny
        document.getElementById("delete-edit-question-btn").hidden = true;

        // Rensa formuläret
        document.getElementById("question-form").reset();

        // Rätt knapptext
        document.getElementById("question-submit-btn").textContent = "Skapa fråga";
    });

    //Avbryt lägg till fråge mode, invertera ovan
    document.getElementById("cancel-card-question-layout").addEventListener("click", ()=>{
        editingQuestionsId = null;

        document.getElementById("question-list-card").hidden = true;
        document.getElementById("btn-edit-question").hidden = false;
        document.getElementById("cancel-card-question-layout").hidden = true; 

    })

    //Lisetner för att skicka en APi request för att radera en fråga
    document.getElementById("delete-edit-question-btn").addEventListener("click", async () => {
    const errorMessage = document.getElementById("question-error-message");

    const confirmed = confirm("Är du säker på att du vill ta bort frågan?");

    if (!confirmed) {
        return;
    }

    if (editingQuestionsId === null) {
        return;
    }

    const response = await fetch("/api/admin/prediction_question", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
            id: editingQuestionsId
        })
    });

    if (!response.ok) {
        const data = await response.json();

        errorMessage.textContent =
            data.error || "Kunde inte radera frågan";

        return;
    }

    showToast("Frågan har raderats!", "errors");

    // Nollställ redigering
    editingQuestionsId = null;

    // Töm formuläret
    document.getElementById("question-form").reset();

    // Dölj formuläret
    document.getElementById("question-list-card").hidden = true;

    // Visa skapa-knappen igen
    document.getElementById("btn-edit-question").hidden = false;

    // Dölj avbryt-knappen
    document.getElementById("cancel-card-question-layout").hidden = true;

    // Dölj radera-knappen
    document.getElementById("delete-edit-question-btn").hidden = true;

    // Ladda om frågorna
    await loadQuestions();
});

    //oM man klickar Spara så skapas en ny / uppdateras en fråga baserat på editing Match
    document.getElementById("question-form").addEventListener("submit", async event => {
        event.preventDefault();

        const errorMessage = document.getElementById("question-error-message");
        errorMessage.textContent = "";

        const question = document.getElementById("question").value.trim();

        if (!question) {
            errorMessage.textContent = "Frågan får inte vara tom.";
            return;
        }

        // --- REDIGERA ---
        if (editingQuestionsId !== null) {

            const response = await fetch("/api/admin/prediction_question", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    id: editingQuestionsId,
                    label: question
                })
            });

            if (!response.ok) {
                const data = await response.json();
                errorMessage.textContent =
                    data.error || "Kunde inte uppdatera frågan";
                return;
            }

            showToast("Frågan har uppdaterats!");

        } else {

            // --- SKAPA ---
            const tournament_id =
                document.getElementById("tournament-select").value;

            const response = await fetch("/api/admin/prediction_question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    tournament_id,
                    label: question
                })
            });

            if (!response.ok) {
                const data = await response.json();
                errorMessage.textContent =
                    data.error || "Kunde inte skapa fråga";
                return;
            }

            showToast("Frågan har skapats!");
        }

        // Återställ formuläret
        editingQuestionsId = null;

        document.getElementById("question-form").reset();


        document.getElementById("question-submit-btn").textContent =
            "Skapa fråga";

        document.getElementById("question-list-card").hidden = true;
        document.getElementById("btn-edit-question").hidden = false;
        document.getElementById("cancel-card-question-layout").hidden = true;

        await loadQuestions();
    });



    async function loadQuestions() {
        const tournamentId = document.getElementById("tournament-select").value;

        if (!tournamentId) return;

        const response = await fetch(
            `/api/admin/prediction_question?tournament_id=${tournamentId}`,
            { credentials: "same-origin" }
        );

        if (!response.ok) {
            const data = await response.json();
            console.error("Kunde inte hämta frågor:", data);
            return;
        }

        const questions = await response.json();

        const list = document.getElementById("question-list");
        list.innerHTML = "";
        list.className = "list";

        questions.forEach(question => {
            const li = document.createElement("li");
            li.className = "question-item";

            // FRÅGA
            const label = document.createElement("span");
            label.textContent = question.label;

            // RÄTT SVAR
            const answerInput = document.createElement("input");
            answerInput.type = "text";
            answerInput.className = "question-answer-input";
            answerInput.placeholder = "Rätt svar";

            // Om det redan finns ett rätt svar
            if (question.correct_answer_value) {
                answerInput.value = question.correct_answer_value;
            }

            // Spara när rätt svar ändras
            answerInput.addEventListener("change", async () => {
                await saveQuestionResult(
                    question.id,
                    answerInput.value.trim()
                );
            });

            // REDIGERA
            const button = document.createElement("button");
            button.textContent = "Redigera";
            button.className = "btn btn-secondary";

            button.addEventListener("click", () => {
                editingQuestionsId = question.id;

                // Öppna formuläret
                const card = document.getElementById("question-list-card");
                card.hidden = false;

                // Dölj "Skapa fråga"-knappen
                document.getElementById("btn-edit-question").hidden = true;

                // Visa avbryt-knappen
                document.getElementById("cancel-card-question-layout").hidden = false;

                // Visa radera
                document.getElementById("delete-edit-question-btn").hidden = false;

                // Fyll i befintlig fråga
                document.getElementById("question").value = question.label;

                document.getElementById("question-submit-btn").textContent =
                    "Spara ändringar";
            });

            li.appendChild(label);
            li.appendChild(answerInput);
            li.appendChild(button);

            list.appendChild(li);
        });
    }
    
    async function saveQuestionResult(questionId, correctAnswer) {
        if (!correctAnswer) {
            return;
        }

        try {
            const response = await fetch(
                "/api/admin/question_result",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        question_id: questionId,
                        correct_answer_value: correctAnswer
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    data.error || "Kunde inte spara rätt svar"
                );
                return;
            }

            showToast("Rätt svar sparat!");

        } catch (error) {
            console.error(
                "Fel vid sparande av rätt svar:",
                error
            );
        }
    }
}




    
    