// --- MATCHER ---

export async function populateTeamSelects() {
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

export async function loadMatches() {
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