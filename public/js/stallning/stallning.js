async function loadStandings() {
    const list = document.getElementById("standings-list");

    try {
        const response = await fetch("/api/user/standings", { credentials: "same-origin" });
        if (!response.ok) throw new Error("Kunde inte hämta ställningen");

        const data = await response.json();
        const standings = data.standings;
        const currentUserId = data.current_user_id;

        list.innerHTML = "";

        standings.forEach((player, index) => {
            const li = document.createElement("li");
            li.className = "standings-item";

            const position = document.createElement("span");
            position.className = "standings-position";
            if (player.id === currentUserId) li.classList.add("current-user");

            if (index === 0) position.textContent = "🥇";
            else if (index === 1) position.textContent = "🥈";
            else if (index === 2) position.textContent = "🥉";
            else position.textContent = `${index + 1}.`;

            const username = document.createElement("span");
            username.className = "standings-username";
            username.textContent = player.username;

            const points = document.createElement("span");
            points.className = "standings-points";
            points.textContent = `${player.points} p`;

            li.appendChild(position);
            li.appendChild(username);
            li.appendChild(points);
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Ställning FEL:", err);
        list.innerHTML = `<p class="error">Kunde inte hämta ställningen</p>`;
    }
}

loadStandings();

async function loadPointsChart() {
    try {
        const response = await fetch("/api/user/standings_history", { credentials: "same-origin" });
        if (!response.ok) throw new Error("Kunde inte hämta poänghistorik");

        const history = await response.json();
        const canvas = document.getElementById("points-chart");

        // Hämta alla unika användare
        const users = [...new Map(history.map(item => [item.user_id, { id: item.user_id, username: item.username }])).values()];

        // Hämta alla unika datum
        const dates = [...new Map(history.map(item => [item.date, item.date])).values()];

        const datasets = users.map(user => ({
            label: user.username,
            data: dates.map(date => {
                const player = history.find(item => item.user_id === user.id && item.date === date);
                return player ? player.points : 0;
            }),
            tension: 0.3
        }));

        new Chart(canvas, {
            type: "line",
            data: {
                labels: dates.map(date => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: "Poäng" } },
                    x: { title: { display: true, text: "Datum" } }
                },
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    } catch (err) {
        console.error("Poänggraf FEL:", err);
    }
}

loadPointsChart();

async function loadAllPredictions() {
    try {
        const response = await fetch("/api/user/all_predictions");
        if (!response.ok) throw new Error("Kunde inte hämta ställningen");

        const data = await response.json();
        myUserId = data.current_user_id;
        predictions = data.predictions;

        renderAllPredictions();
    } catch (error) {
        console.error("Fel vid hämtning: ", error);
    }
}

function renderAllPredictions() {
    const mainContainer = document.getElementById("all-predictions");

    mainContainer.innerHTML = "";
    // Ny isolerad klass för huvudcontainern
    mainContainer.className = "all-preds-wrapper";

    if (predictions.length === 0) {
        const message = document.createElement("p");
        message.className = "all-preds-no-matches";
        message.textContent = "Det finns inga tips ännu.";
        mainContainer.appendChild(message);
        return;
    }

    // =========================
    // ALLA ANVÄNDARE
    // =========================
    const users = [];
    predictions.forEach(prediction => {
        if (!users.some(user => user.id === prediction.user_id)) {
            users.push({
                id: prediction.user_id,
                username: prediction.username
            });
        }
    });

    // =========================
    // SORTERA MATCHER
    // =========================
    const matchIds = [...new Set(predictions.map(p => p.match_id))];
    matchIds.sort((a, b) => {
        const matchA = predictions.find(p => p.match_id === a);
        const matchB = predictions.find(p => p.match_id === b);
        return new Date(matchA.kickoff_at) - new Date(matchB.kickoff_at);
    });

    // =========================
    // HUVUDCONTAINER & SCROLL
    // =========================
    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "all-preds-scroll";

    const list = document.createElement("div");
    list.className = "all-preds-list-container";
    list.style.setProperty("--user-count", users.length);

    // =========================
    // GLOBAL HEADER (Användarnamnen)
    // =========================
    const headerRow = document.createElement("div");
    headerRow.className = "all-preds-row all-preds-header-row";

    const emptyCorner = document.createElement("div");
    headerRow.appendChild(emptyCorner);

    users.forEach(user => {
        const userHeader = document.createElement("div");
        userHeader.className = "all-preds-header-name";
        userHeader.textContent = user.id === myUserId ? "Du" : user.username;
        headerRow.appendChild(userHeader);
    });

    list.appendChild(headerRow);

    let currentDate = null;

    // =========================
    // MATCHER
    // =========================
    matchIds.forEach(matchId => {
        const matchPredictions = predictions.filter(p => p.match_id === matchId);
        const match = matchPredictions[0];
        const date = new Date(match.kickoff_at);
        const dateKey = date.toLocaleDateString("sv-SE");

        // =========================
        // NYTT DATUM
        // =========================
        if (dateKey !== currentDate) {
            currentDate = dateKey;

            const dateHeading = document.createElement("h3");
            dateHeading.className = "all-preds-date";
            dateHeading.textContent = date.toLocaleDateString("sv-SE", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            list.appendChild(dateHeading);
        }

        // =========================
        // MATCH-RAD
        // =========================
        const matchRow = document.createElement("div");
        matchRow.className = "all-preds-row all-preds-match-item";

        // MATCHINFO
        const matchInfo = document.createElement("div");
        matchInfo.className = "all-preds-match-info";

        const teams = document.createElement("div");
        teams.className = "all-preds-teams";
        teams.textContent = `${match.home_team} - ${match.away_team}`;

        const time = document.createElement("div");
        time.className = "all-preds-time";
        time.textContent = date.toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const resultExists = match.result_home_score !== null && match.result_away_score !== null;
        matchInfo.appendChild(teams);

        if (resultExists) {
            const result = document.createElement("div");
            result.className = "all-preds-result";
            result.textContent = `${match.result_home_score} – ${match.result_away_score}`;

            matchInfo.appendChild(result);
        }

        matchRow.appendChild(matchInfo);

        // =========================
        // PREDICTIONS
        // =========================
        const deadlinePassed = new Date() >= new Date(match.deadline_at);

        users.forEach(user => {
            const cell = document.createElement("div");
            cell.className = "all-preds-cell";
            const prediction = matchPredictions.find(p => p.user_id === user.id);

            // DITT TIPS
            if (user.id === myUserId) {
                cell.classList.add("all-preds-cell-my");

                if (!prediction || prediction.home_score === null) {
                    cell.textContent = "–";
                } else {
                    const h = Number(prediction.home_score);
                    const a = Number(prediction.away_score);

                    // Själva tipset
                    const score = document.createElement("div");
                    score.className = "all-preds-score";
                    score.textContent = `${h} – ${a}`;

                    cell.appendChild(score);

                    // Poäng, om matchresultat finns
                    if (prediction.points !== null) {
                        const points = document.createElement("div");
                        points.className = "all-preds-points";

                        const p = Number(prediction.points);
                        points.textContent = `${p > 0 ? "+" : ""}${p} p`;

                        cell.appendChild(points);
                    }

                    setIsolatedPredictionResultClass(cell, h, a, match);
                    if ( match.result_home_score !== null &&
                        match.result_away_score !== null
                    ) {
                        cell.classList.add("all-preds-cell-clickable");

                        cell.addEventListener("click", () => {
                            openPredictionModal(prediction, match);
                        });
                    }
                }

                matchRow.appendChild(cell);
                return;
            }

            // ANDRAS TIPS – LÅSTA
            if (!deadlinePassed) {
                cell.classList.add("all-preds-cell-locked");
                cell.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                        <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                        <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                        <circle cx="12" cy="15.5" r="1"></circle>
                    </svg>
                `;
                matchRow.appendChild(cell);
                return;
            }

            // ANDRAS TIPS – ÖPPNA
            if (!prediction || prediction.home_score === null) {
                cell.textContent = "–";
                matchRow.appendChild(cell);
                return;
            }

            const h = Number(prediction.home_score);
            const a = Number(prediction.away_score);

            const score = document.createElement("div");
            score.className = "all-preds-score";
            score.textContent = `${h} – ${a}`;

            cell.appendChild(score);

            if (prediction.points !== null) {
                const points = document.createElement("div");
                points.className = "all-preds-points";

                const p = Number(prediction.points);
                points.textContent = `${p > 0 ? "+" : ""}${p} p`;

                cell.appendChild(points);
            }

            setIsolatedPredictionResultClass(cell, h, a, match);
            matchRow.appendChild(cell);
            if (match.result_home_score !== null &&
                match.result_away_score !== null
            ) {
                cell.classList.add("all-preds-cell-clickable");

                cell.addEventListener("click", () => {
                    openPredictionModal(prediction, match);
                });
            }
        });

        list.appendChild(matchRow);
    });

    scrollWrapper.appendChild(list);
    mainContainer.appendChild(scrollWrapper);
}

// Egen funktion för att sätta rätt isolerade färg-klasser
function setIsolatedPredictionResultClass(cell, predictionHome, predictionAway, match) {
    const resultExists = match.result_home_score !== null && match.result_away_score !== null;
    if (!resultExists) return;

    const resultHome = Number(match.result_home_score);
    const resultAway = Number(match.result_away_score);

    // Exakt resultat
    if (predictionHome === resultHome && predictionAway === resultAway) {
        cell.classList.add("all-preds-exact");
        return;
    }

    // Rätt vinnare / oavgjort
    if (getMatchOutcome(predictionHome, predictionAway) === getMatchOutcome(resultHome, resultAway)) {
        cell.classList.add("all-preds-winner");
        return;
    }

    // Fel vinnare
    cell.classList.add("all-preds-wrong");
}

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



function openPredictionModal(prediction, match) {
    const modal = document.getElementById("prediction-modal");
    const body = document.getElementById("prediction-modal-body");

    const resultHome = Number(match.result_home_score);
    const resultAway = Number(match.result_away_score);

    const predictionHome = Number(prediction.home_score);
    const predictionAway = Number(prediction.away_score);

    const points = Number(prediction.points);

    let explanation = "";

    const predictionOutcome = getMatchOutcome(
        predictionHome,
        predictionAway
    );

    const resultOutcome = getMatchOutcome(
        resultHome,
        resultAway
    );

    const predictionDiff = predictionHome - predictionAway;
    const resultDiff = resultHome - resultAway;

    if (
        predictionHome === resultHome &&
        predictionAway === resultAway
    ) {
        explanation = `${prediction.username} tippade exakt rätt resultat.`;
    } else if (predictionDiff === resultDiff) {
        explanation = `${prediction.username} tippade rätt målskillnad.`;
    } else if (predictionOutcome === resultOutcome) {
        explanation = `${prediction.username} tippade rätt vinnare.`;
    } else {
        explanation = `${prediction.username}s tips hade fel matchutfall.`;
    }

    body.innerHTML = `
        <div class="prediction-modal-match">
            <div class="prediction-modal-teams">
                ${match.home_team} – ${match.away_team}
            </div>
        </div>

        <div class="prediction-modal-result-label">
            Resultat
        </div>

        <div class="prediction-modal-result">
            ${resultHome} – ${resultAway}
        </div>

        <div class="prediction-modal-tip-label">
            ${prediction.username === "Erik" ? "Ditt tips" : `${prediction.username}s tips`}
        </div>

        <div class="prediction-modal-tip">
            ${predictionHome} – ${predictionAway}
        </div>

        <div class="prediction-modal-points ${getPointsClass(points)}">
            <div class="prediction-modal-points-value">
                ${points > 0 ? "+" : ""}${points} p
            </div>
        </div>

        <div class="prediction-modal-explanation">
            <div class="prediction-modal-explanation-title">
                Så räknades poängen
            </div>

            <p class="prediction-modal-explanation-text">
                ${explanation}
            </p>
        </div>
    `;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
}

function closePredictionModal() {
    const modal = document.getElementById("prediction-modal");

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

document
    .getElementById("prediction-modal-close")
    .addEventListener("click", closePredictionModal);

document
    .querySelector(".prediction-modal-backdrop")
    .addEventListener("click", closePredictionModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closePredictionModal();
    }
});

function getPointsClass(points) {
    if (points >= 3) return "prediction-points-exact";
    if (points > 0) return "prediction-points-correct";
    return "prediction-points-wrong";
}

loadAllPredictions();
