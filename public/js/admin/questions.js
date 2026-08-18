
import { setupToggleCard, hideCard } from "./ui.js";

// --- Utslagsfrågor ---

let editingQuestionsId = null;

export async function setupQuestionManagement() {

    //ladda frågor
    await loadQuestions();
    const tournament_id = document.getElementById("tournament-select").value;


    //Gå in i lägg till fråge mode
    document.getElementById("btn-edit-question").addEventListener("click", ()=>{
        document.getElementById("question-list-card").hidden = false;
        document.getElementById("btn-edit-question").hidden = true;
        document.getElementById("cancel-card-question-layout").hidden = false;

    })

    //Avbryt lägg till fråge mode, invertera ovan
    document.getElementById("cancel-card-question-layout").addEventListener("click", ()=>{
        editingQuestionsId = null;
        document.getElementById("question-list-card").hidden = true;
        document.getElementById("btn-edit-question").hidden = false;
        document.getElementById("cancel-card-question-layout").hidden = true; 
    })

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
                    tournament_id: tournament_id,
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

            const label = document.createElement("span");
            label.textContent = question.label;

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

                // Fyll i befintlig fråga
                document.getElementById("question").value = question.label;

                document.getElementById("question-submit-btn").textContent =
                    "Spara ändringar";                
            });

            li.appendChild(label);
            li.appendChild(button);

            list.appendChild(li);
        });
}
    
}




    
    