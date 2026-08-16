let editingUserId = null;

(async () => {
  const user = await requireAuth();
  if (!user) return;

  if (!user.is_admin) {
    document.body.innerHTML = "<p>Du har inte behörighet att se den här sidan.</p>";
    return;
  }

  await loadTournaments();
  await populateTournamentSelect();
  await loadUsers();  

})();

// --- SPELARE ---

// Funktion för att editera användare mode
function startEditUsers(user) {
  editingUserId = user.id;

  document.getElementById("user-id").value = user.id;

  document.getElementById("user-username").value = user.username;

  // Lösenord ska vara tomt vid redigering
  document.getElementById("user-password").value = "";

  document.getElementById("user-is-admin").checked = !!user.is_admin;

  document.getElementById("user-form-title").textContent = "Redigera en spelare";

  document.getElementById("user-submit-btn").textContent = "Spara ändringar";
  document.getElementById("user-submit-btn").textContent = "Spara ändringar";
  document.getElementById("cancel-edit-btn").hidden = false;
  document.getElementById('delete-edit-btn').hidden = false;
  document.getElementById("password-help").textContent = "Lämna tomt för att behålla nuvarande lösenord.";

  // Scrolla upp till formuläret
  document.getElementById("user-form").scrollIntoView({
    behavior: "smooth"
  });
}

// Funktion för att gå ut från editeringsmode
function cancelEditUser() {
  editingUserId = null;

  document.getElementById("user-form").reset();

  document.getElementById("user-form-title").textContent = "Skapa spelare";
  document.getElementById("user-submit-btn").textContent = "Skapa spelare";
  document.getElementById("cancel-edit-btn").hidden = true;
  document.getElementById('delete-edit-btn').hidden = true;


  document.getElementById("password-help").textContent = "Krävs när en ny spelare skapas.";
  document.getElementById("user-error-message").textContent = "";
}


// Funktionen som renderar alla användare
async function loadUsers() {
  const response = await fetch("/api/admin/users", { credentials: "same-origin" });
  const users = await response.json();

  const list = document.getElementById("user-list");
  list.innerHTML = "";
  list.className = "list";
  users.forEach(u => {
    const li = document.createElement("li");

    const name = document.createElement("span")
    name.textContent = `${u.username}${u.is_admin ? " (admin)" : ""}`;


    const button = document.createElement("button");
    button.textContent = "Redigera"
    button.className = "btn btn-secondary"

    button.addEventListener("click", () =>{
      startEditUsers(u);
    });

    li.appendChild(name);
    li.appendChild(button);

    list.appendChild(li);

  });
}
document.getElementById("cancel-edit-btn").addEventListener("click", cancelEditUser);
document.getElementById("delete-edit-btn").addEventListener("click", async ()=>{
  if (editingUserId === null){
    return;
  }


  //Dubbelkolla att man vill ta bort data
  const confirmed = confirm(
    "Är du säker på att du vill radera spelaren?"
  );

  if (!confirmed){
    return;
  }



  const response = await fetch("/api/admin/users",{
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify({
      id: editingUserId
    })
  });
  if (!response.ok){
    const data = await response.json();
    const errorMessage = document.getElementById("user-error-message");
    errorMessage.textContent = data.error || "Kunde inte radera spelaren";
    return;

  }
  cancelEditUser();
  await loadUsers();
  showToast("Spelaren har raderats!", "error")
})

//Klickar man spara så skickas ett api request för att antingen skapa, ändra eller radera en användare
document.getElementById("user-form").addEventListener("submit", async (event) => {

    event.preventDefault();
    const errorMessage = document.getElementById("user-error-message");

    errorMessage.textContent = "";

    const username =
      document.getElementById("user-username").value.trim();

    const password =
      document.getElementById("user-password").value;

    const is_admin =
      document.getElementById("user-is-admin").checked;

    // REDIGERA
    if (editingUserId !== null) {

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          id: editingUserId,
          username,
          password,
          is_admin
        })
      });

      if (!response.ok) {
        const data = await response.json();

        errorMessage.textContent =
          data.error || "Kunde inte uppdatera spelaren";

        return;
      }

      cancelEditUser();
      await loadUsers();
      showToast("Spelaren har uppdaterats");

      return;
    }

    // SKAPA
    if (!password) {
      errorMessage.textContent =
        "Lösenord krävs när en ny spelare skapas.";

      return;
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        username,
        password,
        is_admin
      })
    });

    if (!response.ok) {
      const data = await response.json();

      errorMessage.textContent =
        data.error || "Kunde inte skapa spelaren";

      return;
    }

    document.getElementById("user-form").reset();

    await loadUsers();
    showToast("Spelaren har skapats!")
  });


document.getElementById("logout-btn").addEventListener("click", logout);




// --- TURNERINGAR ---

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

// --- LAG---

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


// --- MATCHER ---

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