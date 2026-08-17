import { setupToggleCard, hideCard } from "./ui.js";

// --- LAG ---

let editingTeamId = null;
let teams = [];

export async function setupTeamManagement() {
  setupToggleCard(
    "create-team-btn",
    "create-team-card",
    "cancel-create-team"
  );

  await loadTeams();

  // ÄNDRAR MAN TURNERING SKA LAGEN LADDAS OM
  document.getElementById("tournament-select").addEventListener("change", loadTeams);

  // KLICKAR MAN EDIT SKA EDITERA-FLIKEN KOMMA UPP
  document.getElementById("edit-team-btn").addEventListener("click", showEditTeamSearch);

  // SÖKFUNKTIONEN
  document.getElementById("team-search").addEventListener("input", searchTeams);

  // DELETE-KNAPPEN
  document.getElementById("delete-edit-team-btn").addEventListener("click", deleteTeam);

  // AVBRYT SÖK
  document.getElementById("cancel-edit-team-search").addEventListener("click", () => {
    editingTeamId = null;

    document.getElementById("edit-team-card").hidden = true;
    document.getElementById("edit-team-btn").hidden = false;
    document.getElementById("create-team-btn").hidden = false;

    document.getElementById("team-form").reset();

    document.querySelector("#team-form button[type='submit']").textContent =
      "Skapa lag";

    document.getElementById("team-error-message").textContent = "";

    document.getElementById("team-search").value = "";
    document.getElementById("team-search-list").innerHTML = "";
  });

  // SKAPA ELLER REDIGERA LAG
  document.getElementById("team-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const tournament_id = document.getElementById("tournament-select").value;
    const name = document.getElementById("team-name").value.trim();
    const group_name = document.getElementById("team-group").value.trim();

    // REDIGERA BEFINTLIGT LAG
    if (editingTeamId !== null) {
      const response = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: editingTeamId,
          name,
          group_name
        })
      });

      if (!response.ok) {
        const data = await response.json();
        document.getElementById("team-error-message").textContent =
          data.error || "Kunde inte uppdatera laget";
        return;
      }

      editingTeamId = null;

      document.getElementById("team-form").reset();

      document.querySelector("#create-team-card h3").textContent =
        "Lägg till lag";

      document.querySelector("#team-form button[type='submit']").textContent =
        "Skapa lag";

      document.getElementById("delete-edit-team-btn").hidden = true;

      await loadTeams();

      hideCard(
        "create-team-btn",
        "create-team-card",
        "cancel-create-team"
      );

      document.getElementById("edit-team-btn").hidden = false;

      showToast("Laget har uppdaterats!");

      return;
    }

    // SKAPA NYTT LAG
    const response = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        tournament_id,
        name,
        group_name
      })
    });

    if (!response.ok) {
      const data = await response.json();
      document.getElementById("team-error-message").textContent =
        data.error || "Kunde inte skapa laget";
      return;
    }

    document.getElementById("team-form").reset();

    await loadTeams();

    hideCard(
      "create-team-btn",
      "create-team-card",
      "cancel-create-team"
    );

    showToast("Laget har skapats!");
  });
}


// LADDA LAG

async function loadTeams() {
  const tournamentId = document.getElementById("tournament-select").value;
  if (!tournamentId) return;

  const response = await fetch(`/api/admin/teams?tournament_id=${tournamentId}`, {
    credentials: "same-origin"
  });

  teams = await response.json();

  const list = document.getElementById("team-list");
  list.innerHTML = "";

  // Gruppera lagen efter grupp
  const groups = {};

  teams.forEach(team => {
    const group = team.group_name || "Ingen grupp";

    if (!groups[group]) {
      groups[group] = [];
    }

    groups[group].push(team);
  });

  // Sortera grupperna alfabetiskt
  Object.keys(groups).sort().forEach(group => {
    const groupTitle = document.createElement("li");
    groupTitle.textContent = `Grupp ${group}`;
    groupTitle.className = "team-group-title";

    list.appendChild(groupTitle);

    groups[group].forEach((team, index) => {
      const li = document.createElement("li");
      li.textContent = `${team.name}`;
      list.appendChild(li);
    });
  });
}


// REDIGERA LAG

function startEditTeam(team) {
  editingTeamId = team.id;

  // Dölj sökrutan
  document.getElementById("edit-team-card").hidden = true;

  // Visa formuläret
  document.getElementById("create-team-card").hidden = false;

  // Fyll i information
  document.getElementById("team-name").value = team.name;
  document.getElementById("team-group").value = team.group_name || "";

  // Ändra rubrik
  document.querySelector("#create-team-card h3").textContent =
    "Redigera lag";

  // Ändra submit-knapp
  document.querySelector("#team-form button[type='submit']").textContent =
    "Spara ändringar";

  // Visa radera-knappen
  document.getElementById("delete-edit-team-btn").hidden = false;
}


// SÖK LAG

function searchTeams() {
  const search = document
    .getElementById("team-search")
    .value
    .toLowerCase()
    .trim();

  const results = teams.filter(team =>
    team.name.toLowerCase().includes(search)
  );

  const list = document.getElementById("team-search-list");
  list.innerHTML = "";

  results.forEach(team => {
    const li = document.createElement("li");
    li.textContent = team.name;
    li.classList.add("team-search-result");

    li.addEventListener("click", () => {
      startEditTeam(team);
    });

    list.appendChild(li);
  });
}


// VISA SÖKFORMULÄR FÖR REDIGERING

function showEditTeamSearch() {
  document.getElementById("edit-team-card").hidden = false;
  document.getElementById("edit-team-btn").hidden = true;
  document.getElementById("create-team-btn").hidden = true;
}


// RADERA LAG

async function deleteTeam() {
  if (editingTeamId === null) {
    return;
  }

  const confirmed = confirm("Är du säker på att du vill radera laget?");

  if (!confirmed) {
    return;
  }

  const response = await fetch("/api/admin/teams", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      id: editingTeamId
    })
  });

  if (!response.ok) {
    const data = await response.json();

    document.getElementById("team-error-message").textContent =
      data.error || "Kunde inte radera laget";

    return;
  }

  editingTeamId = null;

  document.getElementById("team-form").reset();

  await loadTeams();

  document.getElementById("delete-edit-team-btn").hidden = true;

  hideCard(
    "create-team-btn",
    "create-team-card",
    "cancel-create-team"
  );

  document.getElementById("edit-team-btn").hidden = false;
  showToast("Laget har raderats!");
}