let todaysMatches = [];
let allUsers = [];
let currentUserId = null;
let currentUsername = null;

async function loadTodaysMatches() {
    try {
        // Hämta både alla användare och dagens matcher parallellt
        const [usersRes, matchesRes] = await Promise.all([
            fetch("/api/user/users"),
            fetch("/api/user/match_predictions?today=true")
        ]);

        if (!usersRes.ok || !matchesRes.ok) {
            throw new Error("Kunde inte hämta data!");
        }

        allUsers = await usersRes.json();
        const matchData = await matchesRes.json();

        todaysMatches = matchData.matches;
        currentUserId = matchData.current_user_id;
        currentUsername = matchData.current_username;

        renderTodaysMatches();
    } catch (error) {
        console.error(error);
    }
}

async function loadMyPoints(){
    try{
        const response = await fetch("/api/user/standings?my_points=true");

        if (!response.ok){
            throw new Error ("Kunde inte hämta mina poäng");
        }

        data = await response.json();
        myPosition = data.position;
        myPoints = data.points;
        renderMyPoints();

    }

    catch (error){
        console.error(error);
    }
}

function renderMyPoints(){
    document.getElementById("user-points").textContent = myPoints;
    document.getElementById("user-position").textContent = myPosition;
}
loadMyPoints();

function renderTodaysMatches() {
    const mainContainer = document.getElementById("todays-matches");
    mainContainer.innerHTML = "";
    mainContainer.className = "card todays-matches-card"; // Kortet i botten

    if (todaysMatches.length === 0) {
        const message = document.createElement("p");
        message.className = "no-matches-message";
        message.textContent = "Det finns inga matcher idag.";
        mainContainer.appendChild(message);
        return;
    }

    // Skapa en scrollbar wrapper inuti kortet
    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "table-scroll-wrapper";

    const gridContainer = document.createElement("div");
    gridContainer.className = "matches-grid";

    // Hämta användare
    const otherUsers = allUsers.filter(user => user.id !== currentUserId);

    // Sätt upp Grid-kolumner dynamiskt på grid-containern
    gridContainer.style.gridTemplateColumns = `2fr repeat(${1 + otherUsers.length}, minmax(70px, 1fr))`;

    // =================================================
    // HEADER
    // =================================================
    const matchHeader = document.createElement("div");
    matchHeader.className = "today-match-info header-title";
    matchHeader.textContent = "Match";
    gridContainer.appendChild(matchHeader);

    const youHeader = document.createElement("div");
    youHeader.className = "today-user-column header-name";
    youHeader.textContent = "Du";
    gridContainer.appendChild(youHeader);

    otherUsers.forEach(user => {
        const userHeader = document.createElement("div");
        userHeader.className = "today-user-column header-name";
        userHeader.textContent = user.username;
        gridContainer.appendChild(userHeader);
    });

    // =================================================
    // MATCHER & RADER
    // =================================================
    const matchIds = [...new Set(todaysMatches.map(match => match.match_id))];

    matchIds.forEach(matchId => {
        const matchPredictions = todaysMatches.filter(match => match.match_id === matchId);
        const match = matchPredictions[0];

        // Match Info
        const matchInfo = document.createElement("div");
        matchInfo.className = "today-match-info";

        const date = new Date(match.kickoff_at);
        const time = document.createElement("span");
        time.className = "today-match-time";
        time.textContent = date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

        const teams = document.createElement("span");
        teams.className = "today-match-teams";
        teams.textContent = `${match.home_team} – ${match.away_team}`;

        matchInfo.appendChild(time);
        matchInfo.appendChild(teams);
        gridContainer.appendChild(matchInfo);

        // DITT TIPS
        const myPrediction = matchPredictions.find(prediction => prediction.user_id === currentUserId);
        const myCell = document.createElement("div");
        myCell.className = "today-prediction my-prediction";
        myCell.textContent = myPrediction ? `${myPrediction.home_score} – ${myPrediction.away_score}` : "–";
        gridContainer.appendChild(myCell);

        // DEADLINE-KONTROLL
        const isLocked = new Date() < new Date(match.deadline_at);

        // ÖVRIGA ANVÄNDARE
        otherUsers.forEach(user => {
            const cell = document.createElement("div");
            cell.className = "today-prediction";

            if (isLocked) {
                cell.classList.add("prediction-lock");
                cell.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-label="Tips låst">
                        <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                        <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                        <circle cx="12" cy="15.5" r="1"></circle>
                    </svg>
                `;
            } else {
                const prediction = matchPredictions.find(prediction => prediction.user_id === user.id);
                cell.textContent = prediction ? `${prediction.home_score} – ${prediction.away_score}` : "–";
            }

            gridContainer.appendChild(cell);
        });
    });

    // Sätt ihop elementen
    scrollWrapper.appendChild(gridContainer);
    mainContainer.appendChild(scrollWrapper);
}

loadTodaysMatches();



async function loadUpcomingMatches() {
    try {
        // Hämta både alla användare och dagens matcher parallellt

        const response = await fetch("/api/user/matches?coming_games=3");

        if (!response.ok){
            throw new Error("Kunde inte hämta upcoming matches");
        }

        futureGames = await response.json();

    } catch (error) {
        console.error(error);
    }

    renderUpcomingMatches();
}


function renderUpcomingMatches() {
    const list = document.getElementById("next-tips-list");

    list.innerHTML = "";
    list.className = "list";

    if (futureGames.length === 0) {
        const message = document.createElement("p");
        message.className = "no-matches-message";
        message.textContent = "Du har inga matcher att tippa just nu";

        list.appendChild(message);
        return;
    }

    let currentDate = null;
    let dateGroup = null;

    futureGames.forEach(match => {
        const date = new Date(match.kickoff_at);
        const dateKey = date.toLocaleDateString("sv-SE");

        // NYTT DATUM
        if (dateKey !== currentDate) {
            currentDate = dateKey;

            dateGroup = document.createElement("div");
            dateGroup.className = "match-date-group";

            const dateHeading = document.createElement("h3");
            dateHeading.className = "date_of_game";
            dateHeading.textContent = date.toLocaleDateString("sv-SE", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            dateGroup.appendChild(dateHeading);
            list.appendChild(dateGroup);
        }

        // MATCH
        const li = document.createElement("li");
        li.className = "match-item editable";

        // Gör matchen klickbar
        li.addEventListener("click", () => {
            window.location.href = `mina-tips.html?match=${match.id}`;
        });

        const teams = document.createElement("div");
        teams.className = "match-teams";

        const homeTeam = document.createElement("span");
        homeTeam.textContent = match.home_team;

        const vs = document.createElement("span");
        vs.textContent = " - ";

        const awayTeam = document.createElement("span");
        awayTeam.textContent = match.away_team;

        teams.appendChild(homeTeam);
        teams.appendChild(vs);
        teams.appendChild(awayTeam);

        // TID
        const time = document.createElement("span");
        time.className = "match-time";
        time.textContent = date.toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit"
        });

        li.appendChild(teams);
        li.appendChild(time);

        dateGroup.appendChild(li);
    });
}
loadUpcomingMatches();