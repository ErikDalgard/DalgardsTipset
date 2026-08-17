// --- MATCHER ---

let editingMatchId = null;
let matches = [];

export async function setupMatchManagement() {
  await loadMatches();
  await populateTeamSelects();

  // ÄNDRAR MAN TURNERING SKA MATCHER & LAG LADDAS OM
  document.getElementById("tournament-select").addEventListener("change", async () => {
    await loadMatches();
    await populateTeamSelects();
  });

  // KLICKAR MAN LÄGG TILL MATCH
  document.getElementById("create-match-btn").addEventListener("click", showCreateMatch);

  // KLICKAR MAN REDIGERA MATCH
  document.getElementById("edit-match-btn").addEventListener("click", showEditMatchSearch);

  // SÖK FUNKTION
  document.getElementById("match-search").addEventListener("input", searchMatches);

  // RADERA MATCH
  document.getElementById("delete-edit-match-btn").addEventListener("click", deleteMatch);

  // AVBRYT SÖK
  document.getElementById("cancel-edit-match-search").addEventListener("click", cancelEditMatchSearch);

  // AVBRYT SKAPA / REDIGERA
  document.getElementById("cancel-create-match").addEventListener("click", cancelCreateMatch);

  // SKAPA / REDIGERA MATCH
  document.getElementById("match-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorMessage = document.getElementById("match-error-message");
    errorMessage.textContent = "";

    const tournament_id = document.getElementById("tournament-select").value;
    const home_team_id = document.getElementById("home-team").value;
    const away_team_id = document.getElementById("away-team").value;
    const kickoffInput = document.getElementById("kickoff").value;
    const kickoff_at = new Date(kickoffInput).toISOString();

    // REDIGERA BEFINTLIG MATCH
    if (editingMatchId !== null) {
      const response = await fetch("/api/admin/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: editingMatchId, home_team_id, away_team_id, kickoff_at })
      });

      if (!response.ok) {
        const data = await response.json();
        errorMessage.textContent = data.error || "Kunde inte uppdatera matchen";
        return;
      }

      editingMatchId = null;
      document.getElementById("match-form").reset();
      document.getElementById("match-form-title").textContent = "Lägg till match";
      document.getElementById("match-submit-btn").textContent = "Lägg till match";
      document.getElementById("delete-edit-match-btn").hidden = true;

      await loadMatches();
      await populateTeamSelects();
      hideMatchForm();

      showToast("Matchen har uppdaterats!");
      return;
    }

    // SKAPA NY MATCH
    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ tournament_id, home_team_id, away_team_id, kickoff_at })
    });

    if (!response.ok) {
      const data = await response.json();
      errorMessage.textContent = data.error || "Kunde inte skapa match";
      return;
    }

    document.getElementById("match-form").reset();

    await loadMatches();
    await populateTeamSelects();
    hideMatchForm();

    showToast("Matchen har skapats!");
  });
}


// --- HÄMTA LAG TILL DROPDOWN ---

async function populateTeamSelects() {
  const tournamentId = document.getElementById("tournament-select").value;
  if (!tournamentId) return;

  const response = await fetch(`/api/admin/teams?tournament_id=${tournamentId}`, {
    credentials: "same-origin"
  });

  const teams = await response.json();

  const homeSelect = document.getElementById("home-team");
  const awaySelect = document.getElementById("away-team");

  homeSelect.innerHTML = "";
  awaySelect.innerHTML = "";

  teams.forEach(t => {
    [homeSelect, awaySelect].forEach(select => {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.name;
      select.appendChild(option);
    });
  });
}


// --- HÄMTA MATCHER ---

async function loadMatches() {
  const tournamentId = document.getElementById("tournament-select").value;
  if (!tournamentId) return;

  const response = await fetch(`/api/admin/matches?tournament_id=${tournamentId}`, {
    credentials: "same-origin"
  });

  matches = await response.json();

  const list = document.getElementById("match-list");
  list.innerHTML = "";

  matches.forEach(m => {
    const li = document.createElement("li");
    const kickoff = new Date(m.kickoff_at).toLocaleString("sv-SE");
    li.textContent = `${m.home_team} vs ${m.away_team} – ${kickoff}`;
    list.appendChild(li);
  });
}


// --- VISA SKAPA MATCH ---

function showCreateMatch() {
  editingMatchId = null;

  document.getElementById("create-match-card").hidden = false;
  document.getElementById("edit-match-card").hidden = true;
  document.getElementById("create-match-btn").hidden = true;
  document.getElementById("edit-match-btn").hidden = true;

  document.getElementById("match-form-title").textContent = "Lägg till match";
  document.getElementById("match-submit-btn").textContent = "Lägg till match";
  document.getElementById("delete-edit-match-btn").hidden = true;
  document.getElementById("cancel-create-match").hidden = false;

  document.getElementById("match-form").reset();
  document.getElementById("match-error-message").textContent = "";

  populateTeamSelects();
}


// --- VISA SÖK FÖR REDIGERING ---

function showEditMatchSearch() {
  document.getElementById("edit-match-card").hidden = false;
  document.getElementById("create-match-card").hidden = true;
  document.getElementById("edit-match-btn").hidden = true;
  document.getElementById("create-match-btn").hidden = true;

  document.getElementById("match-search").value = "";
  document.getElementById("match-search-list").innerHTML = "";
}


// --- SÖK MATCHER ---

function searchMatches() {
  const search = document.getElementById("match-search").value.toLowerCase().trim();

  const results = matches.filter(match =>
    match.home_team.toLowerCase().includes(search) ||
    match.away_team.toLowerCase().includes(search)
  );

  const list = document.getElementById("match-search-list");
  list.innerHTML = "";

  results.forEach(match => {
    const li = document.createElement("li");
    const kickoff = new Date(match.kickoff_at).toLocaleString("sv-SE");

    li.textContent = `${match.home_team} vs ${match.away_team} – ${kickoff}`;
    li.classList.add("team-search-result");

    li.addEventListener("click", () => {
      startEditMatch(match);
    });

    list.appendChild(li);
  });
}


// --- STARTA REDIGERING AV MATCH ---

async function startEditMatch(match) {
  editingMatchId = match.id;

  document.getElementById("edit-match-card").hidden = true;
  document.getElementById("create-match-card").hidden = false;

  await populateTeamSelects();

  document.getElementById("home-team").value = match.home_team_id;
  document.getElementById("away-team").value = match.away_team_id;

  const kickoff = new Date(match.kickoff_at);
  const localKickoff = new Date(kickoff.getTime() - kickoff.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  document.getElementById("kickoff").value = localKickoff;

  document.getElementById("match-form-title").textContent = "Redigera match";
  document.getElementById("match-submit-btn").textContent = "Spara ändringar";
  document.getElementById("delete-edit-match-btn").hidden = false;
  document.getElementById("cancel-create-match").hidden = false;
}


// --- AVBRYT SÖK ---

function cancelEditMatchSearch() {
  editingMatchId = null;

  document.getElementById("edit-match-card").hidden = true;
  document.getElementById("edit-match-btn").hidden = false;
  document.getElementById("create-match-btn").hidden = false;

  document.getElementById("match-search").value = "";
  document.getElementById("match-search-list").innerHTML = "";
}


// --- AVBRYT SKAPA / REDIGERA ---

function cancelCreateMatch() {
  editingMatchId = null;

  document.getElementById("match-form").reset();
  document.getElementById("match-form-title").textContent = "Lägg till match";
  document.getElementById("match-submit-btn").textContent = "Lägg till match";
  document.getElementById("delete-edit-match-btn").hidden = true;
  document.getElementById("match-error-message").textContent = "";

  hideMatchForm();
}


// --- DÖLJ MATCHFORMULÄRET ---

function hideMatchForm() {
  document.getElementById("create-match-card").hidden = true;
  document.getElementById("create-match-btn").hidden = false;
  document.getElementById("edit-match-btn").hidden = false;
  document.getElementById("cancel-create-match").hidden = true;
}


// --- RADERA MATCH ---

async function deleteMatch() {
  if (editingMatchId === null) return;

  const confirmed = confirm("Är du säker på att du vill radera matchen?");
  if (!confirmed) return;

  const response = await fetch("/api/admin/matches", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ id: editingMatchId })
  });

  if (!response.ok) {
    const data = await response.json();
    document.getElementById("match-error-message").textContent =
      data.error || "Kunde inte radera matchen";
    return;
  }

  editingMatchId = null;

  document.getElementById("match-form").reset();
  document.getElementById("delete-edit-match-btn").hidden = true;

  await loadMatches();

  hideMatchForm();

  showToast("Matchen har raderats!");
}