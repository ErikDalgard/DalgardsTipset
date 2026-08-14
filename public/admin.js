(async () => {
  const user = await requireAuth();
  if (!user) return;

  if (!user.is_admin) {
    document.body.innerHTML = "<p>Du har inte behörighet att se den här sidan.</p>";
    return;
  }

  await loadTournaments();
  await populateTournamentSelect();
})();

// --- Turneringar ---

async function loadTournaments() {
  const response = await fetch("/api/admin/tournaments", { credentials: "same-origin" });
  const tournaments = await response.json();

  const list = document.getElementById("tournament-list");
  list.innerHTML = "";
  tournaments.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.name} (${t.status}) – ${t.start_date || "inget datum"}`;
    list.appendChild(li);
  });

  return tournaments;
}

document.getElementById("tournament-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = "";

  const name = document.getElementById("name").value;
  const start_date = document.getElementById("start_date").value;

  const response = await fetch("/api/admin/tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name, start_date })
  });

  if (!response.ok) {
    const data = await response.json();
    errorMessage.textContent = data.error || "Något gick fel";
    return;
  }

  document.getElementById("tournament-form").reset();
  await loadTournaments();
  await populateTournamentSelect(); // ny turnering ska synas i dropdownen också
});

// --- Lag ---

async function populateTournamentSelect() {
  const tournaments = await loadTournaments();
  const select = document.getElementById("tournament-select");
  const previousValue = select.value;

  select.innerHTML = "";
  tournaments.forEach(t => {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.name;
    select.appendChild(option);
  });

  // behåll tidigare val om möjligt, annars första i listan
  if (previousValue) select.value = previousValue;

  await loadTeams();
}

document.getElementById("tournament-select").addEventListener("change", loadTeams);

async function loadTeams() {
  const tournamentId = document.getElementById("tournament-select").value;
  if (!tournamentId) return;

  const response = await fetch(`/api/admin/teams?tournament_id=${tournamentId}`, {
    credentials: "same-origin"
  });
  const teams = await response.json();

  const list = document.getElementById("team-list");
  list.innerHTML = "";
  teams.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.name}${t.group_name ? " (Grupp " + t.group_name + ")" : ""}`;
    list.appendChild(li);
  });

  await populateTeamSelects();
  await loadMatches();
}

document.getElementById("team-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorMessage = document.getElementById("team-error-message");
  errorMessage.textContent = "";

  const tournament_id = document.getElementById("tournament-select").value;
  const name = document.getElementById("team-name").value;
  const group_name = document.getElementById("team-group").value;

  const response = await fetch("/api/admin/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ tournament_id, name, group_name })
  });

  if (!response.ok) {
    const data = await response.json();
    errorMessage.textContent = data.error || "Något gick fel";
    return;
  }

  document.getElementById("team-form").reset();
  await loadTeams();
});


// --- Matcher ---

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

async function loadMatches() {
  const tournamentId = document.getElementById("tournament-select").value;
  if (!tournamentId) return;

  const response = await fetch(`/api/admin/matches?tournament_id=${tournamentId}`, {
    credentials: "same-origin"
  });
  const matches = await response.json();

  const list = document.getElementById("match-list");
  list.innerHTML = "";
  matches.forEach(m => {
    const li = document.createElement("li");
    const kickoff = new Date(m.kickoff_at).toLocaleString("sv-SE");
    li.textContent = `${m.home_team} vs ${m.away_team} – ${kickoff}`;
    list.appendChild(li);
  });
}

document.getElementById("match-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorMessage = document.getElementById("match-error-message");
  errorMessage.textContent = "";

  const tournament_id = document.getElementById("tournament-select").value;
  const home_team_id = document.getElementById("home-team").value;
  const away_team_id = document.getElementById("away-team").value;
  const kickoffInput = document.getElementById("kickoff").value; 
  const kickoff_at = new Date(kickoffInput).toISOString();

  const response = await fetch("/api/admin/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ tournament_id, home_team_id, away_team_id, kickoff_at })
  });

  if (!response.ok) {
    const data = await response.json();
    errorMessage.textContent = data.error || "Något gick fel";
    return;
  }

  document.getElementById("match-form").reset();
  await loadMatches();
});