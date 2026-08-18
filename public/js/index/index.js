let todaysMatches = [];
let currentUserId = null;

async function loadTodaysMatches() {
    const response = await fetch("/api/user/match_predictions?today=true");

    if (!response.ok) {
        throw new Error("Kunde inte hämta dagens matcher!");
    }

    const data = await response.json();

    todaysMatches = data.matches;
    currentUsername = data.current_username;
    currentUserId = data.current_user_id

    renderTodaysMatches();
}

function renderTodaysMatches() {
    const container = document.getElementById("todays-matches");
    container.innerHTML = "";

    if (todaysMatches.length === 0) {
        const message = document.createElement("p");
        message.className = "no-matches-message";
        message.textContent = "Det finns inga matcher idag.";
        container.appendChild(message);
        return;
    }

    // HÄMTA ALLA UNIKA ANVÄNDARE
    const userMap = new Map();
    todaysMatches.forEach(match => {
        if (match.user_id !== null) {
            userMap.set(match.user_id, match.username);
        }
    });

    const userIds = [...userMap.keys()];
    const otherUserIds = userIds.filter(userId => userId !== currentUserId);

    // Beräkna totala antal kolumner: 1 för matchinfo + 1 för "Du" + antal övriga användare
    const totalColumns = 1 + 1 + otherUserIds.length;
    
    // Sätt CSS Grid-kolumner dynamiskt på containern (eller använd en wrapper)
    container.style.display = "grid";
    container.style.gridTemplateColumns = `2fr repeat(${1 + otherUserIds.length}, 1fr)`;
    container.style.gap = "12px 16px";
    container.style.alignItems = "center";

    // =================================================
    // HEADER
    // =================================================
    const matchHeader = document.createElement("div");
    matchHeader.className = "today-match-info header-title";
    matchHeader.textContent = "Match";
    container.appendChild(matchHeader);

    const youHeader = document.createElement("div");
    youHeader.className = "today-user-column header-name";
    youHeader.textContent = "Du";
    container.appendChild(youHeader);

    otherUserIds.forEach(userId => {
        const userHeader = document.createElement("div");
        userHeader.className = "today-user-column header-name";
        userHeader.textContent = userMap.get(userId);
        container.appendChild(userHeader);
    });

    // =================================================
    // MATCHER & RADER
    // =================================================
    const matchIds = [...new Set(todaysMatches.map(match => match.match_id))];

    matchIds.forEach(matchId => {
        const matchPredictions = todaysMatches.filter(match => match.match_id === matchId);
        const match = matchPredictions[0];

        // Match Info (Tid & Lag)
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
        container.appendChild(matchInfo);

        // DITT TIPS
        const myPrediction = matchPredictions.find(prediction => prediction.user_id === currentUserId);
        const myCell = document.createElement("div");
        myCell.className = "today-prediction my-prediction";
        myCell.textContent = myPrediction ? `${myPrediction.home_score} – ${myPrediction.away_score}` : "–";
        container.appendChild(myCell);

        // DEADLINE-KONTROLL
        const isLocked = new Date() < new Date(match.deadline_at);

        // ÖVRIGA ANVÄNDARE
        otherUserIds.forEach(userId => {
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
                const prediction = matchPredictions.find(prediction => prediction.user_id === userId);
                cell.textContent = prediction ? `${prediction.home_score} – ${prediction.away_score}` : "–";
            }

            container.appendChild(cell);
        });
    });
}

loadTodaysMatches();