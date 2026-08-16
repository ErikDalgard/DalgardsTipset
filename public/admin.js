let editingUserId = null;
let editingTournamentId = null;

(async () => {
  const user = await requireAuth();
  if (!user) return;

  if (!user.is_admin) {
    document.body.innerHTML = "<p>Du har inte behörighet att se den här sidan.</p>";
    return;
  }

  const tournaments = await loadTournaments();
  await populateTournamentSelect(tournaments);
  await loadUsers();  

})();


//Fuktioner för att visa / dölja redigeringsinställningar
function setupToggleCard(showButtonId, cardId, cancelButtonId) {
  const showButton = document.getElementById(showButtonId);
  const card = document.getElementById(cardId);
  const cancelButton = document.getElementById(cancelButtonId);

  showButton.addEventListener("click", () => {
    card.hidden = false;
    showButton.hidden = true;
    cancelButton.hidden = false;
  });

  cancelButton.addEventListener("click", () => {
    hideCard(showButtonId, cardId, cancelButtonId);
  });
}

function hideCard(showButtonId, cardId, cancelButtonId) {
  const card = document.getElementById(cardId);
  const showButton = document.getElementById(showButtonId);
  const cancelButton = document.getElementById(cancelButtonId);

  card.hidden = true;
  showButton.hidden = false;
  cancelButton.hidden = true;
}

// --- SPELARE ---

setupToggleCard(
  "btn-show-edit-user-list",
  "user-list-card",
  "cancel-card-user-layout"
);

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
  document.getElementById("cancel-edit-user-btn").hidden = false;
  document.getElementById('delete-edit-user-btn').hidden = false;
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
  document.getElementById("cancel-edit-user-btn").hidden = true;
  document.getElementById('delete-edit-user-btn').hidden = true;


  document.getElementById("password-help").textContent = "Krävs när en ny spelare skapas.";
  document.getElementById("user-error-message").textContent = "";

  hideCard(
    "btn-show-edit-user-list",
    "user-list-card",
    "cancel-card-user-layout"
  );
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
        const card = document.getElementById("user-list-card");
        card.hidden = false;

        const button_show = document.getElementById("btn-show-edit-user-list");
        button_show.hidden = true;

      startEditUsers(u);

    });

    li.appendChild(name);
    li.appendChild(button);

    list.appendChild(li);

  });
}
  document.getElementById("cancel-edit-user-btn").addEventListener("click", cancelEditUser);
  document.getElementById("delete-edit-user-btn").addEventListener("click", async ()=>{
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
  const tournamentId =
    document.getElementById("tournament-select").value;

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


// --- MATCHER ---

async function populateTeamSelects() {
  const tournamentId =
    document.getElementById("tournament-select").value;

  if (!tournamentId) return;

  const response = await fetch(
    `/api/admin/teams?tournament_id=${tournamentId}`,
    {
      credentials: "same-origin"
    }
  );

  const teams = await response.json();

  const homeSelect =
    document.getElementById("home-team");

  const awaySelect =
    document.getElementById("away-team");

  homeSelect.innerHTML = "";
  awaySelect.innerHTML = "";

  teams.forEach(t => {
    [homeSelect, awaySelect].forEach(select => {
      const option =
        document.createElement("option");

      option.value = t.id;
      option.textContent = t.name;

      select.appendChild(option);
    });
  });
}


async function loadMatches() {
  const tournamentId =
    document.getElementById("tournament-select").value;

  if (!tournamentId) return;

  const response = await fetch(
    `/api/admin/matches?tournament_id=${tournamentId}`,
    {
      credentials: "same-origin"
    }
  );

  const matches = await response.json();

  const list =
    document.getElementById("match-list");

  list.innerHTML = "";

  matches.forEach(m => {
    const li = document.createElement("li");

    const kickoff =
      new Date(m.kickoff_at).toLocaleString("sv-SE");

    li.textContent =
      `${m.home_team} vs ${m.away_team} – ${kickoff}`;

    list.appendChild(li);
  });
}


document
  .getElementById("match-form")
  .addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const errorMessage =
        document.getElementById("match-error-message");

      errorMessage.textContent = "";

      const tournament_id =
        document.getElementById("tournament-select").value;

      const home_team_id =
        document.getElementById("home-team").value;

      const away_team_id =
        document.getElementById("away-team").value;

      const kickoffInput =
        document.getElementById("kickoff").value;

      const kickoff_at =
        new Date(kickoffInput).toISOString();

      const response = await fetch(
        "/api/admin/matches",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify({
            tournament_id,
            home_team_id,
            away_team_id,
            kickoff_at
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();

        errorMessage.textContent =
          data.error || "Något gick fel";

        return;
      }

      document
        .getElementById("match-form")
        .reset();

      await loadMatches();
    }
  );


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