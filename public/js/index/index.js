let todaysMatches = [];
let allUsers = [];
let currentUserId = null;
let currentUsername = null;
let futureGames = []; // Lade till denna för att undvika "undefined"-fel i loadUpcomingMatches
let myPosition = null;
let myPoints = null;

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

        const data = await response.json(); // Lade till 'const' här för snyggare kod
        myPosition = data.position;
        myPoints = data.points;
        renderMyPoints();

    } catch (error){
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
    mainContainer.className = "card todays-matches-card";

    if (todaysMatches.length === 0) {
        const message = document.createElement("p");
        message.className = "no-matches-message";
        message.textContent = "Det finns inga matcher idag.";
        mainContainer.appendChild(message);
        return;
    }

    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "table-scroll-wrapper";

    const gridContainer = document.createElement("div");
    gridContainer.className = "matches-grid";

    // =================================================
    // SORTERA ANVÄNDARE (Du hamnar först)
    // =================================================
    const usersToRender = [...allUsers].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return 0;
    });

    // Sätt upp Grid-kolumner dynamiskt beroende på antal användare
    gridContainer.style.gridTemplateColumns = `2fr repeat(${usersToRender.length}, minmax(70px, 1fr))`;

    // =================================================
    // HEADER
    // =================================================
    const matchHeader = document.createElement("div");
    matchHeader.className = "today-match-info header-title";
    matchHeader.textContent = "Match";
    gridContainer.appendChild(matchHeader);

    usersToRender.forEach(user => {
        const userHeader = document.createElement("div");
        userHeader.className = "today-user-column header-name";
        // Kalla inloggad användare för "Du", annars deras namn
        userHeader.textContent = user.id === currentUserId ? "Du" : user.username;
        gridContainer.appendChild(userHeader);
    });

    // =================================================
    // MATCHER & RADER
    // =================================================
    const matchIds = [...new Set(todaysMatches.map(match => match.match_id))];

    matchIds.forEach(matchId => {
        const matchPredictions = todaysMatches.filter(match => match.match_id === matchId);
        const match = matchPredictions[0];
        const isLocked = new Date() < new Date(match.deadline_at);

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

        // =================================================
        // TIPS (Loopar alla användare på samma sätt)
        // =================================================
        usersToRender.forEach(user => {
            const cell = document.createElement("div");
            cell.className = "today-prediction";
            

            // Dölj andras tips om deadline inte passerat
            if (isLocked && user.id !== currentUserId) {
                cell.classList.add("prediction-lock");
                cell.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-label="Tips låst">
                        <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                        <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                        <circle cx="12" cy="15.5" r="1"></circle>
                    </svg>
                `;
            } else {
                // Hämta tipset (antingen ditt eget som alltid visas, eller andras efter deadline)
                const prediction = matchPredictions.find(p => p.user_id === user.id);
                
                if (prediction && prediction.home_score !== null && prediction.away_score !== null) {
                    const h = Number(prediction.home_score);
                    const a = Number(prediction.away_score);
                    
                    cell.textContent = `${h} – ${a}`;
                    addPredictionResultClass(cell, h, a, match);
                } else {
                    cell.textContent = "–";
                }
            }

            gridContainer.appendChild(cell);
        });
    });

    scrollWrapper.appendChild(gridContainer);
    mainContainer.appendChild(scrollWrapper);
}

loadTodaysMatches();

const scoreCard = document.getElementById("user-score-card");
scoreCard.addEventListener("click", () => {
    window.location.href = "stallning.html";
});

async function loadUpcomingMatches() {
    try {
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
        li.className = "match-item clickable";

        // Gör matchen klickbar
        li.addEventListener("click", () => {
            window.location.href = `mina-tips.html`;
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
        li.appendChild(time);
        li.appendChild(teams);

        dateGroup.appendChild(li);
    });
}

loadUpcomingMatches();

function getMatchOutcome(home, away) {
    if (home > away) return "home";
    if (away > home) return "away";
    return "draw";
}

function addPredictionResultClass(cell, predictionHome, predictionAway, match) {
    const resultExists = match.result_home_score !== null && match.result_away_score !== null;
    if (!resultExists) return;

    const resultHome = Number(match.result_home_score);
    const resultAway = Number(match.result_away_score);

    // Exakt resultat
    if (predictionHome === resultHome && predictionAway === resultAway) {
        cell.classList.add("prediction-exact");
        return;
    }

    // Rätt vinnare / oavgjort
    if (getMatchOutcome(predictionHome, predictionAway) === getMatchOutcome(resultHome, resultAway)) {
        cell.classList.add("prediction-winner");
        return;
    }

    // Fel vinnare
    cell.classList.add("prediction-wrong");
}