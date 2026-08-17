import { setupToggleCard, hideCard } from "./ui.js";
import {populateTeamSelects, loadMatches} from "./matches.js"

// --- TURNERINGAR ---
let editingTournamentId = null;


export async function setupTournamentManagement(){
    setupToggleCard(
    "btn-show-edit-to-list",
    "to-list-card",
    "cancel-card-tu-layout"
    );

    // Funktion för att rendera alla turneringar
    async function loadTournaments() {
    const response = await fetch(
        "/api/admin/tournaments",
        {
        credentials: "same-origin"
        }
    );

    const tournaments = await response.json();

    const list = document.getElementById("tournament-list");
    list.innerHTML = "";
    list.className = "list";

    tournaments.forEach(t => {
        const li = document.createElement("li");

        const name = document.createElement("span");
        name.textContent = t.name;

        const status = document.createElement("span");
        status.textContent = t.status;

        const start_date = document.createElement("span");
        start_date.textContent =
        t.start_date || "Inget datum";

        const button = document.createElement("button");
        button.textContent = "Redigera";
        button.className = "btn btn-secondary";

        button.addEventListener("click", () => {
        startEditTournament(t);

        const card = document.getElementById("to-list-card");
        card.hidden = false;

        const button_show =
            document.getElementById("btn-show-edit-to-list");

        button_show.hidden = true;
        });

        li.appendChild(name);
        li.appendChild(status);
        li.appendChild(start_date);
        li.appendChild(button);

        list.appendChild(li);
    });

    return tournaments;
    }


    async function populateTournamentSelect(tournaments) {
    const select =
        document.getElementById("tournament-select");

    const previousValue = select.value;

    select.innerHTML = "";

    tournaments.forEach(t => {
        const option = document.createElement("option");

        option.value = t.id;
        option.textContent = t.name;

        select.appendChild(option);
    });

    if (previousValue) {
        select.value = previousValue;
    }

    await loadTeams();
    }


    async function loadTeams() {
    const tournamentId = document.getElementById("tournament-select").value;

    if (!tournamentId) return;

    const response = await fetch(
        `/api/admin/teams?tournament_id=${tournamentId}`,
        {
        credentials: "same-origin"
        }
    );

    const teams = await response.json();
    const list = document.getElementById("team-list");
    list.innerHTML = "";

    teams.forEach(t => {
        const li = document.createElement("li");

        li.textContent =
        `${t.name}${t.group_name ? " (Grupp " + t.group_name + ")" : ""}`;

        list.appendChild(li);
    });

    await populateTeamSelects();
    await loadMatches();
    }

    //Ändras turnering ska lagan laddas om!
    document.getElementById("tournament-select").addEventListener("change", loadTeams);


    // Funktion för att editera en turnering
    function startEditTournament(tournament) {
    editingTournamentId = tournament.id;

    document.getElementById("name").value =
        tournament.name;

    document.getElementById("start_date").value =
        tournament.start_date || "";

    document.getElementById("tournament-form-title").textContent =
        "Redigera turnering";

    document.getElementById("tournament-submit-btn").textContent =
        "Spara ändringar";

    document.getElementById("delete-tournament-btn").hidden =
        false;

    document.getElementById("cancel-tournament-edit-btn").hidden =
        false;

    document.getElementById("tournament-form").scrollIntoView({
        behavior: "smooth"
    });
    }


    // Funktion för att gå ut från editeringsmode
    function cancelEditTournament() {
    editingTournamentId = null;

    document.getElementById("tournament-form").reset();

    document.getElementById("tournament-form-title").textContent =
        "Skapa ny turnering";

    document.getElementById("tournament-submit-btn").textContent =
        "Skapa";

    document.getElementById("delete-tournament-btn").hidden =
        true;

    document.getElementById("cancel-tournament-edit-btn").hidden =
        true;

    document.getElementById("error-message").textContent = "";

    hideCard(
        "btn-show-edit-to-list",
        "to-list-card",
        "cancel-card-tu-layout"
    );
    }


    document
    .getElementById("cancel-tournament-edit-btn")
    .addEventListener(
        "click",
        cancelEditTournament
    );


    // Klickar man spara så skickas API-request för
    // att antingen skapa eller uppdatera en turnering
    document
    .getElementById("tournament-form")
    .addEventListener(
        "submit",
        async (event) => {

        event.preventDefault();

        const errorMessage =
            document.getElementById("error-message");

        errorMessage.textContent = "";

        const name =
            document.getElementById("name").value.trim();

        const start_date =
            document.getElementById("start_date").value;


        // REDIGERA
        if (editingTournamentId !== null) {

            const response = await fetch(
            "/api/admin/tournaments",
            {
                method: "PATCH",
                headers: {
                "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                id: editingTournamentId,
                name,
                start_date
                })
            }
            );

            if (!response.ok) {
            const data = await response.json();

            errorMessage.textContent =
                data.error ||
                "Kunde inte uppdatera turneringen";

            return;
            }

            cancelEditTournament();

            const tournaments =
            await loadTournaments();

            await populateTournamentSelect(
            tournaments
            );

            showToast(
            "Turneringen har uppdaterats"
            );

            return;
        }


        // SKAPA
        if (!name) {
            errorMessage.textContent =
            "Namn krävs";

            return;
        }

        const response = await fetch(
            "/api/admin/tournaments",
            {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                name,
                start_date
            })
            }
        );

        if (!response.ok) {
            const data = await response.json();

            errorMessage.textContent =
            data.error ||
            "Kunde inte skapa turneringen";

            return;
        }

        document
            .getElementById("tournament-form")
            .reset();

        const tournaments =
            await loadTournaments();

        await populateTournamentSelect(
            tournaments
        );

        showToast(
            "Turneringen har skapats!"
        );
        }
    );


    // RADERA TURNERING
    document
    .getElementById("delete-tournament-btn")
    .addEventListener(
        "click",
        async () => {

        if (editingTournamentId === null) {
            return;
        }

        const confirmed = confirm(
            "Är du säker på att du vill radera turneringen?"
        );

        if (!confirmed) {
            return;
        }

        const response = await fetch(
            "/api/admin/tournaments",
            {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                id: editingTournamentId
            })
            }
        );

        if (!response.ok) {
            const data = await response.json();

            document
            .getElementById("error-message")
            .textContent =
                data.error ||
                "Kunde inte radera turneringen";

            return;
        }

        cancelEditTournament();

        const tournaments =
            await loadTournaments();

        await populateTournamentSelect(
            tournaments
        );

        showToast(
            "Turneringen har raderats!",
            "error"
        );
        }
    );

    const tournaments = await loadTournaments();
    await populateTournamentSelect(tournaments);
}
