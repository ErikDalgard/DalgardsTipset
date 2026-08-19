import { setupToggleCard, hideCard } from "./ui.js";

let editingTournamentId = null;
const RULE_TYPES = ["exact_score", "correct_diff", "correct_winner"];

export async function setupTournamentManagement() {
    setupToggleCard("btn-show-edit-to-list", "to-list-card", "cancel-card-tu-layout");

    // Funktion för att rendera alla turneringar
    async function loadTournaments() {
        const response = await fetch("/api/admin/tournaments", { credentials: "same-origin" });
        const tournaments = await response.json();

        const list = document.getElementById("tournament-list");
        list.innerHTML = "";
        list.className = "list";

        tournaments.forEach(t => {
            const li = document.createElement("li");
            li.className = "tournament-item";

            const name = document.createElement("span");
            name.textContent = t.name;

            const active_text = document.createElement("span");
            const active = t.active;
            active_text.textContent = active === 0 ? "Passiv" : "Aktiv";

            const start_date = document.createElement("span");
            start_date.textContent = t.start_date || "Inget datum";

            const button = document.createElement("button");
            button.textContent = "Redigera";
            button.className = "btn btn-secondary";

            button.addEventListener("click", () => {
                startEditTournament(t);
                document.getElementById("to-list-card").hidden = false;
                document.getElementById("btn-show-edit-to-list").hidden = true;
            });

            li.appendChild(name);
            li.appendChild(active_text);
            li.appendChild(start_date);
            li.appendChild(button);

            list.appendChild(li);
        });

        return tournaments;
    }

    async function populateTournamentSelect(tournaments) {
        const select = document.getElementById("tournament-select");
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
    }

    // Hämtar poängreglerna för en turnering och fyller i fälten.
    async function loadScoringRules(tournamentId) {
        const response = await fetch(`/api/admin/scoring_rules?tournament_id=${tournamentId}`, { credentials: "same-origin" });

        const rules = await response.json();

        RULE_TYPES.forEach(type => {
            const rule = rules.find(r => r.rule_type === type);
            document.getElementById(`rule-${type}`).value = rule ? rule.points : "";
        });
    }

    // Sparar alla ifyllda poängregler för en turnering
    async function saveScoringRules(tournamentId) {
        for (const type of RULE_TYPES) {
            const value = document.getElementById(`rule-${type}`).value;
            if (value === "") continue;

            await fetch("/api/admin/scoring_rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ tournament_id: tournamentId, rule_type: type, points: Number(value) })
            });
        }
    }

        // Hämtar alla användare och visar vilka som deltar i turneringen
        async function loadTournamentParticipants(tournamentId) {
            const response = await fetch(
                `/api/admin/tournament_participants?tournament_id=${tournamentId}`,
                { credentials: "same-origin" }
            );

            if (!response.ok) {
                console.error("Kunde inte hämta deltagare");
                return;
            }

            const users = await response.json();

            const list = document.getElementById("tournament-users-list");
            list.innerHTML = "";

            users.forEach(user => {
                const label = document.createElement("label");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = user.id;
                checkbox.checked = user.participant === 1;

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${user.username}`));

                list.appendChild(label);
            });
        }
        // Sparar vilka användare som deltar i turneringen
        async function saveTournamentParticipants(tournamentId) {

            // Hämta nuvarande deltagare från databasen
            const response = await fetch(
                `/api/admin/tournament_participants?tournament_id=${tournamentId}`,
                { credentials: "same-origin" }
            );

            if (!response.ok) {
                console.error("Kunde inte hämta nuvarande deltagare");
                return;
            }

            const users = await response.json();

            const checkboxes = document.querySelectorAll(
                "#tournament-users-list input[type='checkbox']"
            );

            for (const checkbox of checkboxes) {
                const userId = Number(checkbox.value);
                const user = users.find(u => u.id === userId);

                if (!user) continue;

                // Ska vara med men är inte med
                if (checkbox.checked && user.participant === 0) {
                    await fetch("/api/admin/tournament_participants", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify({
                            tournament_id: tournamentId,
                            user_id: userId
                        })
                    });
                }

                // Ska inte vara med men är med
                if (!checkbox.checked && user.participant === 1) {
                    await fetch("/api/admin/tournament_participants", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify({
                            tournament_id: tournamentId,
                            user_id: userId
                        })
                    });
                }
            }
        }
    // Funktion för att editera en turnering
    async function startEditTournament(tournament) {
        editingTournamentId = tournament.id;

        document.getElementById("name").value = tournament.name;
        document.getElementById("start_date").value = tournament.start_date || "";
        document.getElementById("active").checked = tournament.active === 1;

        await loadScoringRules(tournament.id);
        await loadTournamentParticipants(tournament.id);

        document.getElementById("tournament-form-title").textContent = "Redigera turnering";
        document.getElementById("tournament-submit-btn").textContent = "Spara ändringar";
        document.getElementById("delete-tournament-btn").hidden = false;
        document.getElementById("cancel-tournament-edit-btn").hidden = false;
        document.getElementById("tournament-form").scrollIntoView({ behavior: "smooth" });
    }

    // Funktion för att gå ut från editeringsmode
    function cancelEditTournament() {
        editingTournamentId = null;

        document.getElementById("tournament-form").reset();
        document.getElementById("tournament-form-title").textContent = "Skapa ny turnering";
        document.getElementById("tournament-submit-btn").textContent = "Skapa";
        document.getElementById("delete-tournament-btn").hidden = true;
        document.getElementById("cancel-tournament-edit-btn").hidden = true;
        document.getElementById("error-message").textContent = "";

        hideCard("btn-show-edit-to-list", "to-list-card", "cancel-card-tu-layout");
    }

    document.getElementById("cancel-tournament-edit-btn").addEventListener("click", cancelEditTournament);

    // Klickar man spara så skickas API-request
    document.getElementById("tournament-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = "";

        const name = document.getElementById("name").value.trim();
        const start_date = document.getElementById("start_date").value;
        const active = document.getElementById("active").checked ? 1 : 0;

        // REDIGERA
        if (editingTournamentId !== null) {
            const response = await fetch("/api/admin/tournaments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ id: editingTournamentId, name, start_date, active })
            });

            if (!response.ok) {
                const data = await response.json();
                errorMessage.textContent = data.error || "Kunde inte uppdatera turneringen";
                await loadTournaments();
                return;
            }

            await saveScoringRules(editingTournamentId);
            await saveTournamentParticipants(editingTournamentId);
            cancelEditTournament();

            const tournaments = await loadTournaments();
            await populateTournamentSelect(tournaments);
            showToast("Turneringen har uppdaterats");
            return;
        }

        // SKAPA
        if (!name) {
            errorMessage.textContent = "Namn krävs";
            return;
        }

        const response = await fetch("/api/admin/tournaments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ name, start_date, active })
        });

        if (!response.ok) {
            const data = await response.json();
            errorMessage.textContent = data.error || "Kunde inte skapa turneringen";
            return;
        }

        const created = await response.json();

        await saveScoringRules(created.id);
        await saveTournamentParticipants(created.id);

        document.getElementById("tournament-form").reset();

        const tournaments = await loadTournaments();
        await populateTournamentSelect(tournaments);
        showToast("Turneringen har skapats!");
    });

    // RADERA TURNERING
    document.getElementById("delete-tournament-btn").addEventListener("click", async () => {
        if (editingTournamentId === null) return;

        const confirmed = confirm("Är du säker på att du vill radera turneringen?");
        if (!confirmed) return;

        console.log("Deleting tournament:", editingTournamentId);

        const response = await fetch("/api/admin/tournaments", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ id: editingTournamentId })
        });

        if (!response.ok) {
            const data = await response.json();
            console.error("Delete error:", data);
            document.getElementById("error-message").textContent = data.error || "Kunde inte radera turneringen";
            return;
        }

        cancelEditTournament();
        const tournaments = await loadTournaments();
        await populateTournamentSelect(tournaments);
        showToast("Turneringen har raderats!", "error");
    });

    const tournaments = await loadTournaments();
    await populateTournamentSelect(tournaments);
}