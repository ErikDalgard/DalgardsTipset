let editingMatchId = null;

// --- MATCHER ---

export async function setupMatchManagement() {
  let matches = [];

  await loadMatches();
  await populateTeamSelects();

  document.getElementById("tournament-select").addEventListener("change", async () => {
    await loadMatches();
    await populateTeamSelects();
  });

  document.getElementById("create-match-btn").addEventListener("click", showCreateMatch);
  document.getElementById("cancel-create-match").addEventListener("click", cancelCreateMatch);
  document.getElementById("edit-match-btn").addEventListener("click", ()=>{
    document.querySelectorAll(".match-item").forEach(matchElement=>{
      matchElement.classList.add("editable");
      matchElement.addEventListener("click", selectMatchToEdit);
    })
    showToast("Klicka på matchen du vill redigera");
  })

  document.getElementById("match-form").addEventListener("submit", async event => {
    event.preventDefault();

    const errorMessage = document.getElementById("match-error-message");
    errorMessage.textContent = "";

    const tournament_id = document.getElementById("tournament-select").value;
    const home_team_id = document.getElementById("home-team").value;
    const away_team_id = document.getElementById("away-team").value;
    const kickoffInput = document.getElementById("kickoff").value;

    if (!kickoffInput) return;

    const kickoff_at = new Date(kickoffInput).toISOString();

      if (editingMatchId !== null){
        const response = await fetch("/api/admin/matches", {
          method: "PATCH",
          headers: {"Content-Type": "application/json"},
          credentials: "same-origin",
          body: JSON.stringify({
            id: editingMatchId,
            home_team_id,
            away_team_id,
            kickoff_at
          })
        })

        if (!response.ok){
          const data = await response.json();
          errorMessage.textContent = data.error || "Kunde inte uppdatera matchen";
          return;
        }

      editingMatchId = null;

      document.getElementById("match-form").reset();

      document.querySelector("#create-match-card h3").textContent =
        "Lägg till match";

      document.querySelector("#match-form button[type='submit']").textContent =
        "Skapa match";

      hideMatchForm();
      
      document.getElementById("edit-match-btn").hidden = false;

      await loadMatches();
      await populateTeamSelects();

      showToast("Matchen har uppdaterats!");
      return;
      }

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
    hideMatchForm();
    await loadMatches();
    await populateTeamSelects();

    showToast("Matchen har skapats!");
  });

  async function populateTeamSelects() {
    const tournamentId = document.getElementById("tournament-select").value;
    if (!tournamentId) return;

    const response = await fetch(`/api/admin/teams?tournament_id=${tournamentId}`, { credentials: "same-origin" });
    if (!response.ok) return;

    const teams = await response.json();
    const homeSelect = document.getElementById("home-team");
    const awaySelect = document.getElementById("away-team");

    homeSelect.innerHTML = "";
    awaySelect.innerHTML = "";

    teams.forEach(team => {
      const homeOption = document.createElement("option");
      homeOption.value = team.id;
      homeOption.textContent = team.name;
      homeSelect.appendChild(homeOption);

      const awayOption = document.createElement("option");
      awayOption.value = team.id;
      awayOption.textContent = team.name;
      awaySelect.appendChild(awayOption);
    });
  }

  async function loadMatches() {
    const tournamentId = document.getElementById("tournament-select").value;
    if (!tournamentId) return;

    const response = await fetch(`/api/admin/matches?tournament_id=${tournamentId}`, { credentials: "same-origin" });
    if (!response.ok) return;

    matches = await response.json();
    matches.sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at));

    const list = document.getElementById("match-list");
    list.innerHTML = "";

    let currentDate = "";

    matches.forEach(match => {
      const date = new Date(match.kickoff_at);
      const dateString = date.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });

      if (dateString !== currentDate) {
        currentDate = dateString;

        const dateHeading = document.createElement("h3");
        dateHeading.className = "match-date";
        dateHeading.textContent = dateString;
        list.appendChild(dateHeading);
      }

      const matchElement = document.createElement("div");
      matchElement.className = "match-item";
      matchElement.dataset.matchId = match.id;

      const time = date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

      matchElement.innerHTML = `
        <div class="match-info">
          <strong>${time}</strong>
          <span>${match.home_team}</span>
          <span>vs</span>
          <span>${match.away_team}</span>
        </div>

        <div class="match-result">
          <input type="number" min="0" class="match-score-input" data-match-id="${match.id}" data-team="home" value="${match.home_score ?? ""}">
          <span>–</span>
          <input type="number" min="0" class="match-score-input" data-match-id="${match.id}" data-team="away" value="${match.away_score ?? ""}">
        </div>
      `;

      list.appendChild(matchElement);
    });

    list.querySelectorAll(".match-score-input").forEach(input => {
      input.addEventListener("change", () => saveResult(Number(input.dataset.matchId)));
    });
  }

  async function saveResult(matchId) {
    const match = matches.find(m => Number(m.id) === matchId);
    if (!match) return;

    const homeInput = document.querySelector(`input[data-match-id="${matchId}"][data-team="home"]`);
    const awayInput = document.querySelector(`input[data-match-id="${matchId}"][data-team="away"]`);

    const homeScore = homeInput.value;
    const awayScore = awayInput.value;

    if (homeScore === "" || awayScore === "") {
      showToast("Fyll i båda resultaten.");
      return;
    }

    const home = Number(homeScore);
    const away = Number(awayScore);

    let winner_team_id = null;

    if (home > away) winner_team_id = match.home_team_id;
    if (away > home) winner_team_id = match.away_team_id;

    const response = await fetch("/api/admin/match_results", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        match_id: matchId,
        home_score: home,
        away_score: away,
        winner_team_id
      })
    });

    if (!response.ok) {
      const data = await response.json();
      showToast(data.error || "Kunde inte spara resultatet");
      return;
    }

    match.home_score = home;
    match.away_score = away;

    showToast("Resultatet har sparats!");
  }

  function showCreateMatch() {
    editingMatchId = null;

    document.getElementById("create-match-card").hidden = false;
    document.getElementById("create-match-btn").hidden = true;
    document.getElementById("cancel-create-match").hidden = false;
    document.getElementById("match-form").reset();
    document.getElementById("match-error-message").textContent = "";
    populateTeamSelects();
  }

  function cancelCreateMatch() {
    editingMatchId = null;

    document.getElementById("match-form").reset();
    document.getElementById("match-error-message").textContent = "";

    document.querySelector("#create-match-card h3").textContent =
      "Lägg till match";

    document.querySelector("#match-form button[type='submit']").textContent =
      "Skapa match";

    hideMatchForm();
  }

  function hideMatchForm() {
    document.getElementById("create-match-card").hidden = true;
    document.getElementById("create-match-btn").hidden = false;
    document.getElementById("cancel-create-match").hidden = true;
  }

  function formatDateTimeLocal(dateString) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

  function selectMatchToEdit(event) {
    // Ignorera klick på resultat-inputsen
    if (event.target.classList.contains("match-score-input")) {
      return;
    }

    const matchId = Number(event.currentTarget.dataset.matchId);
    const match = matches.find(m => Number(m.id) === matchId);

    if (!match) return;

    editingMatchId = matchId;

    // Fyll formuläret med matchens data
    document.getElementById("home-team").value = match.home_team_id;
    document.getElementById("away-team").value = match.away_team_id;
    document.getElementById("kickoff").value =
      formatDateTimeLocal(match.kickoff_at);

    // Ändra rubrik och knapp
    document.querySelector("#create-match-card h3").textContent =
      "Redigera match";

    document.querySelector("#match-form button[type='submit']").textContent =
      "Spara ändringar";

    // Visa formuläret
    document.getElementById("create-match-card").hidden = false;
    document.getElementById("create-match-btn").hidden = true;
    document.getElementById("edit-match-btn").hidden = true;
    document.getElementById("cancel-create-match").hidden = false;

    // Avsluta redigeringsläge
    document.querySelectorAll(".match-item").forEach(matchElement => {
      matchElement.classList.remove("editable");
      matchElement.removeEventListener("click", selectMatchToEdit);
    });
}
}