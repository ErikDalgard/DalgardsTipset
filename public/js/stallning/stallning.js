// ==================== STÄLLNING ====================

async function loadStandings() {
    const list = document.getElementById("standings-list");

    try {
        const response = await fetch("/api/user/standings", { credentials: "same-origin" });
        if (!response.ok) throw new Error("Kunde inte hämta ställningen");

        const { standings, current_user_id: currentUserId } = await response.json();
        list.innerHTML = "";

        standings.forEach((player, index) => {
            const li = document.createElement("li");
            li.className = `standings-item${player.id === currentUserId ? " current-user" : ""}`;

            const position = document.createElement("span");
            position.className = "standings-position";
            position.textContent = ["🥇", "🥈", "🥉"][index] || `${index + 1}.`;

            const username = document.createElement("span");
            username.className = "standings-username";
            username.textContent = player.username;

            const points = document.createElement("span");
            points.className = "standings-points";
            points.textContent = `${player.points} p`;

            li.append(position, username, points);
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Ställning FEL:", err);
        list.innerHTML = `<p class="error">Kunde inte hämta ställningen</p>`;
    }
}


// ==================== POÄNGGRAF ====================

let pointsChart;
let chartMode = "points";
let chartPeriod = "all";

async function loadPointsChart() {
    try {
        const response = await fetch("/api/user/standings_history", { credentials: "same-origin" });
        if (!response.ok) throw new Error("Kunde inte hämta poänghistorik");

        const { current_user: currentUserId, data: history } = await response.json();
        const now = new Date();

        const filteredHistory = chartPeriod === "all"
            ? history
            : history.filter(x => now - new Date(x.date) <= chartPeriod * 86400000);

        updateInsights(filteredHistory, currentUserId);

        if (pointsChart) pointsChart.destroy();

        const users = [...new Map(
            filteredHistory.map(x => [x.user_id, { id: x.user_id, username: x.username }])
        ).values()];

        const dates = [...new Set(filteredHistory.map(x => x.date))];

        const snapshots = dates.map(date =>
            filteredHistory
                .filter(x => x.date === date)
                .sort((a, b) => b.points - a.points)
        );

        const datasets = users.map(user => ({
            label: user.username,
            data: snapshots.map(snapshot => {
                const player = snapshot.find(x => x.user_id === user.id);
                if (!player) return 0;

                return chartMode === "points"
                    ? player.points
                    : snapshot.findIndex(x => x.points === player.points) + 1;
            }),
            tension: 0.3,
            borderWidth: user.id === currentUserId ? 4 : 2,
            pointRadius: user.id === currentUserId ? 4 : 2
        }));

        pointsChart = new Chart(document.getElementById("points-chart"), {
            type: "line",
            data: {
                labels: dates.map(date => {
                    const d = new Date(date);
                    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                }),
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                    y: {
                        beginAtZero: chartMode === "points",
                        reverse: chartMode === "rank",
                        ticks: { stepSize: 1 },
                        title: {
                            display: true,
                            text: chartMode === "points" ? "Poäng" : "Placering"
                        }
                    },
                    x: { title: { display: true, text: "Datum" } }
                },
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        callbacks: {
                            label: ctx => chartMode === "points"
                                ? `${ctx.dataset.label}: ${ctx.raw} poäng`
                                : `${ctx.dataset.label}: #${ctx.raw}`
                        }
                    },
                    zoom: {
                        pan: { enabled: true, mode: "x" },
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            drag: { enabled: true },
                            mode: "x"
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Poänggraf FEL:", err);
    }
}

function updateChartMode() {
    const pointsBtn = document.getElementById("points-toggle");
    const rankBtn = document.getElementById("rank-toggle");

    pointsBtn.className = chartMode === "points" ? "btn" : "btn btn-secondary";
    rankBtn.className = chartMode === "rank" ? "btn" : "btn btn-secondary";

    loadPointsChart();
}


// ==================== GRAF-KONTROLLER ====================

document.getElementById("points-toggle").addEventListener("click", () => {
    if (chartMode === "points") return;
    chartMode = "points";
    updateChartMode();
});

document.getElementById("rank-toggle").addEventListener("click", () => {
    if (chartMode === "rank") return;
    chartMode = "rank";
    updateChartMode();
});

document.querySelectorAll(".chart-period button").forEach(button => {
    button.addEventListener("click", () => {
        chartPeriod = button.dataset.period === "all"
            ? "all"
            : Number(button.dataset.period);

        document.querySelectorAll(".chart-period button").forEach(btn => {
            btn.classList.toggle("btn-secondary", btn !== button);
        });

        loadPointsChart();
    });
});

document.getElementById("insights-toggle").addEventListener("click", () => {
    const insights = document.getElementById("chart-insights");
    const button = document.getElementById("insights-toggle");
    const visible = !insights.hidden;

    insights.hidden = visible;
    button.textContent = visible ? "Visa insikter" : "Dölj insikter";
});


// ==================== INSIGHTS ====================

function updateInsights(history, currentUserId) {
    const personal = document.getElementById("personal-insights");
    const tournament = document.getElementById("tournament-insights");

    const dates = [...new Set(history.map(x => x.date))];

    if (!dates.length) {
        personal.innerHTML = "";
        tournament.innerHTML = "";
        return;
    }

    const first = history.filter(x => x.date === dates[0]);
    const last = history.filter(x => x.date === dates.at(-1));

    const getRank = (snapshot, userId) => {
        const sorted = [...snapshot].sort((a, b) => b.points - a.points);
        const player = sorted.find(x => x.user_id === userId);
        return player ? sorted.findIndex(x => x.points === player.points) + 1 : null;
    };

    const startUser = first.find(x => x.user_id === currentUserId);
    const currentUser = last.find(x => x.user_id === currentUserId);

    if (startUser && currentUser) {
        const startRank = getRank(first, currentUserId);
        const currentRank = getRank(last, currentUserId);
        const pointsChange = currentUser.points - startUser.points;
        const rankChange = startRank - currentRank;

        personal.innerHTML = `
            <div class="insight">
                <div class="insight-label">Poängförändring</div>
                <div class="insight-value">${pointsChange >= 0 ? "+" : ""}${pointsChange}</div>
                <div class="insight-label">senaste perioden</div>
            </div>
            <div class="insight">
                <div class="insight-label">Placering</div>
                <div class="insight-value">#${currentRank}</div>
                <div class="insight-label">nuvarande</div>
            </div>
            <div class="insight">
                <div class="insight-label">Placering</div>
                <div class="insight-value">${rankChange > 0 ? "↑" : rankChange < 0 ? "↓" : "–"} ${Math.abs(rankChange)}</div>
                <div class="insight-label">${rankChange === 0 ? "oförändrad" : "platser sedan periodens början"}</div>
            </div>
        `;
    }

    const players = last.map(player => {
        const start = first.find(x => x.user_id === player.user_id);
        const startRank = getRank(first, player.user_id);
        const currentRank = getRank(last, player.user_id);

        return {
            ...player,
            pointsChange: start ? player.points - start.points : 0,
            rankChange: startRank - currentRank
        };
    });

    const biggestClimber = [...players].sort((a, b) => b.rankChange - a.rankChange)[0];
    const biggestPoints = [...players].sort((a, b) => b.pointsChange - a.pointsChange)[0];
    const leader = [...players].sort((a, b) => b.points - a.points)[0];
    const biggestDrop = [...players].sort((a, b) => a.rankChange - b.rankChange)[0];

    tournament.innerHTML = `
        <div class="insight">
            <div class="insight-label">Största klättrare</div>
            <div class="insight-value">${biggestClimber.username}</div>
            <div class="insight-label">+${biggestClimber.rankChange} placeringar</div>
        </div>
        <div class="insight">
            <div class="insight-label">Största poängökning</div>
            <div class="insight-value">${biggestPoints.username}</div>
            <div class="insight-label">+${biggestPoints.pointsChange} poäng</div>
        </div>
        <div class="insight">
            <div class="insight-label">Ledare</div>
            <div class="insight-value">${leader.username}</div>
            <div class="insight-label">${leader.points} poäng</div>
        </div>
        <div class="insight">
            <div class="insight-label">Största tapp</div>
            <div class="insight-value">${biggestDrop.username}</div>
            <div class="insight-label">−${Math.abs(biggestDrop.rankChange)} placeringar</div>
        </div>
    `;
}


// ==================== ALLA TIPS ====================

let myUserId;
let predictions = [];

async function loadAllPredictions() {
    try {
        const response = await fetch("/api/user/all_predictions");
        if (!response.ok) throw new Error("Kunde inte hämta tipsen");

        const data = await response.json();
        myUserId = data.current_user_id;
        predictions = data.predictions;

        renderAllPredictions();
    } catch (err) {
        console.error("Fel vid hämtning av tips:", err);
    }
}

function renderAllPredictions() {
    const mainContainer = document.getElementById("all-predictions");
    mainContainer.innerHTML = "";
    mainContainer.className = "all-preds-wrapper";

    if (!predictions.length) {
        const message = document.createElement("p");
        message.className = "all-preds-no-matches";
        message.textContent = "Det finns inga tips ännu.";
        mainContainer.appendChild(message);
        return;
    }

    const users = [...new Map(
        predictions.map(p => [p.user_id, { id: p.user_id, username: p.username }])
    ).values()];

    const matchIds = [...new Set(predictions.map(p => p.match_id))].sort((a, b) => {
        const matchA = predictions.find(p => p.match_id === a);
        const matchB = predictions.find(p => p.match_id === b);
        return new Date(matchA.kickoff_at) - new Date(matchB.kickoff_at);
    });

    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "all-preds-scroll";

    const list = document.createElement("div");
    list.className = "all-preds-list-container";
    list.style.setProperty("--user-count", users.length);

    const headerRow = document.createElement("div");
    headerRow.className = "all-preds-row all-preds-header-row";
    headerRow.appendChild(document.createElement("div"));

    users.forEach(user => {
        const header = document.createElement("div");
        header.className = "all-preds-header-name";
        header.textContent = user.id === myUserId ? "Du" : user.username;
        headerRow.appendChild(header);
    });

    list.appendChild(headerRow);

    let currentDate = null;

    matchIds.forEach(matchId => {
        const matchPredictions = predictions.filter(p => p.match_id === matchId);
        const match = matchPredictions[0];
        const date = new Date(match.kickoff_at);
        const dateKey = date.toLocaleDateString("sv-SE");

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

        const matchRow = document.createElement("div");
        matchRow.className = "all-preds-row all-preds-match-item";

        const matchInfo = document.createElement("div");
        matchInfo.className = "all-preds-match-info";

        const teams = document.createElement("div");
        teams.className = "all-preds-teams";
        teams.innerHTML = `<div>${match.home_team}</div><div>${match.away_team}</div>`;

        const result = document.createElement("div");
        result.className = "all-preds-result";
        result.innerHTML = `<div>${match.result_home_score ?? "–"}</div><div>${match.result_away_score ?? "–"}</div>`;

        matchInfo.append(teams, result);
        matchRow.appendChild(matchInfo);

        users.forEach(user => {
            const cell = document.createElement("div");
            cell.className = "all-preds-cell";
            const prediction = matchPredictions.find(p => p.user_id === user.id);

            if (user.id === myUserId) {
                cell.classList.add("all-preds-cell-my");
                renderOwnPrediction(cell, prediction, match);
            } else if (new Date() < new Date(match.deadline_at)) {
                cell.classList.add("all-preds-cell-locked");
                cell.innerHTML = getLockIcon();
            } else {
                renderOtherPrediction(cell, prediction, match);
            }

            matchRow.appendChild(cell);
        });

        list.appendChild(matchRow);
    });

    scrollWrapper.appendChild(list);
    mainContainer.appendChild(scrollWrapper);
}

function renderOwnPrediction(cell, prediction, match) {
    if (!prediction || prediction.home_score === null) {
        cell.textContent = "–";
        return;
    }

    renderPredictionScore(cell, prediction, match);
    cell.classList.add("all-preds-cell-clickable");

    if (match.result_home_score !== null && match.result_away_score !== null) {
        cell.addEventListener("click", () => openPredictionModal(prediction, match));
    }
}

function renderOtherPrediction(cell, prediction, match) {
    if (!prediction || prediction.home_score === null) {
        cell.textContent = "–";
        return;
    }

    renderPredictionScore(cell, prediction, match);

    if (match.result_home_score !== null && match.result_away_score !== null) {
        cell.classList.add("all-preds-cell-clickable");
        cell.addEventListener("click", () => openPredictionModal(prediction, match));
    }
}

function renderPredictionScore(cell, prediction, match) {
    const home = Number(prediction.home_score);
    const away = Number(prediction.away_score);

    const score = document.createElement("div");
    score.className = "all-preds-score";
    score.innerHTML = `<div>${home}</div><div>${away}</div>`;
    cell.appendChild(score);

    if (prediction.points !== null && prediction.points !== undefined) {
        const points = Number(prediction.points);

        if (!Number.isNaN(points)) {
            const pointsElement = document.createElement("div");
            pointsElement.className = "all-preds-points";
            pointsElement.textContent = `${points > 0 ? "+" : ""}${points} p`;
            cell.appendChild(pointsElement);
        }
    }

    setIsolatedPredictionResultClass(cell, home, away, match);
}

function getLockIcon() {
    return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <rect x="3" y="10" width="18" height="11" rx="2"></rect>
            <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
            <circle cx="12" cy="15.5" r="1"></circle>
        </svg>
    `;
}

function setIsolatedPredictionResultClass(cell, predictionHome, predictionAway, match) {
    if (match.result_home_score === null || match.result_away_score === null) return;

    const resultHome = Number(match.result_home_score);
    const resultAway = Number(match.result_away_score);

    if (predictionHome === resultHome && predictionAway === resultAway) {
        cell.classList.add("all-preds-exact");
    } else if (predictionHome - predictionAway === resultHome - resultAway) {
        cell.classList.add("all-preds-goaldiff");
    } else if (getMatchOutcome(predictionHome, predictionAway) === getMatchOutcome(resultHome, resultAway)) {
        cell.classList.add("all-preds-winner");
    } else {
        cell.classList.add("all-preds-wrong");
    }
}

function getMatchOutcome(home, away) {
    if (home > away) return "home";
    if (away > home) return "away";
    return "draw";
}


// ==================== TIP-MODAL ====================

function openPredictionModal(prediction, match) {
    const modal = document.getElementById("prediction-modal");
    const body = document.getElementById("prediction-modal-body");

    const resultHome = Number(match.result_home_score);
    const resultAway = Number(match.result_away_score);
    const predictionHome = Number(prediction.home_score);
    const predictionAway = Number(prediction.away_score);
    const points = Number(prediction.points);

    const predictionOutcome = getMatchOutcome(predictionHome, predictionAway);
    const resultOutcome = getMatchOutcome(resultHome, resultAway);

    let explanation;

    if (predictionHome === resultHome && predictionAway === resultAway) {
        explanation = `${prediction.username} tippade exakt rätt resultat.`;
    } else if (predictionHome - predictionAway === resultHome - resultAway) {
        explanation = `${prediction.username} tippade rätt målskillnad.`;
    } else if (predictionOutcome === resultOutcome) {
        explanation = `${prediction.username} tippade rätt vinnare.`;
    } else {
        explanation = `${prediction.username}s tips hade fel matchutfall.`;
    }

    body.innerHTML = `
        <div class="prediction-modal-match">
            <div class="prediction-modal-teams">${match.home_team} – ${match.away_team}</div>
        </div>
        <div class="prediction-modal-result-label">Resultat</div>
        <div class="prediction-modal-result">${resultHome} – ${resultAway}</div>
        <div class="prediction-modal-tip-label">
            ${prediction.username === "Erik" ? "Ditt tips" : `${prediction.username}s tips`}
        </div>
        <div class="prediction-modal-tip">${predictionHome} – ${predictionAway}</div>
        <div class="prediction-modal-points ${getPointsClass(points)}">
            <div class="prediction-modal-points-value">${points > 0 ? "+" : ""}${points} p</div>
        </div>
        <div class="prediction-modal-explanation">
            <div class="prediction-modal-explanation-title">Så räknades poängen</div>
            <p class="prediction-modal-explanation-text">${explanation}</p>
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

function getPointsClass(points) {
    if (points >= 3) return "all-preds-exact";
    if (points === 2) return "all-preds-goaldiff";
    if (points === 1) return "all-preds-winner";
    return "prediction-points-wrong";
}

document.getElementById("prediction-modal-close").addEventListener("click", closePredictionModal);
document.querySelector(".prediction-modal-backdrop").addEventListener("click", closePredictionModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePredictionModal();
});


// ==================== UTSLAGSFRÅGOR ====================

let knockoutPredictions = [];

async function loadAllKnockoutQuestions() {
    try {
        const response = await fetch("/api/user/knockout_questions");
        if (!response.ok) throw new Error("Kunde inte hämta utslagsfrågorna");

        knockoutPredictions = await response.json();
        renderAllKnockoutQuestions();
    } catch (err) {
        console.error("Utslagsfrågor FEL:", err);
    }
}

function renderAllKnockoutQuestions() {
    const mainContainer = document.getElementById("knockout-questions");
    mainContainer.innerHTML = "";
    mainContainer.className = "knockout-wrapper";

    if (!knockoutPredictions.length) {
        const message = document.createElement("p");
        message.className = "knockout-no-questions";
        message.textContent = "Det finns inga utslagsfrågor ännu.";
        mainContainer.appendChild(message);
        return;
    }

    const users = [...new Map(
        knockoutPredictions.map(p => [p.user_id, { id: p.user_id, username: p.username }])
    ).values()];

    const questionIds = [...new Set(knockoutPredictions.map(p => p.question_id))];

    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "knockout-scroll";

    const list = document.createElement("div");
    list.className = "knockout-list-container";
    list.style.setProperty("--user-count", users.length);

    const headerRow = document.createElement("div");
    headerRow.className = "knockout-row knockout-header-row";

    const questionHeader = document.createElement("div");
    questionHeader.className = "knockout-question-header";
    questionHeader.textContent = "Fråga";

    const answerHeader = document.createElement("div");
    answerHeader.className = "knockout-answer-header";
    answerHeader.textContent = "Svar";

    headerRow.append(questionHeader, answerHeader);

    users.forEach(user => {
        const header = document.createElement("div");
        header.className = "knockout-header-name";
        header.textContent = user.id === myUserId ? "Du" : user.username;
        headerRow.appendChild(header);
    });

    list.appendChild(headerRow);

    questionIds.forEach(questionId => {
        const questionPredictions = knockoutPredictions.filter(p => p.question_id === questionId);
        const question = questionPredictions[0];

        const row = document.createElement("div");
        row.className = "knockout-row knockout-question-row";

        const questionInfo = document.createElement("div");
        questionInfo.className = "knockout-question-info";
        questionInfo.textContent = question.question;

        const correctAnswer = document.createElement("div");
        correctAnswer.className = "knockout-correct-answer";
        correctAnswer.textContent = question.correct_answer ?? "–";

        row.append(questionInfo, correctAnswer);

        users.forEach(user => {
            const cell = document.createElement("div");
            cell.className = "knockout-cell";

            const prediction = questionPredictions.find(p => p.user_id === user.id);

            if (user.id === myUserId) cell.classList.add("knockout-cell-my");

            const startDate = new Date(`${question.start_date}T00:00:00`);

            if (user.id !== myUserId && new Date() < startDate) {
                cell.classList.add("knockout-cell-locked");
                cell.innerHTML = getLockIcon();
                row.appendChild(cell);
                return;
            }

            if (!prediction || prediction.prediction === null) {
                cell.textContent = "–";
                row.appendChild(cell);
                return;
            }

            const answer = document.createElement("div");
            answer.className = "knockout-answer";
            answer.textContent = prediction.prediction;
            cell.appendChild(answer);

            if (
                prediction.correct_answer !== null &&
                prediction.correct_answer !== undefined &&
                prediction.earned_points !== null &&
                prediction.earned_points !== undefined
            ) {
                const correct = prediction.prediction.trim().toLowerCase() === prediction.correct_answer.trim().toLowerCase();

                cell.classList.add(correct ? "knockout-correct" : "knockout-wrong");

                const points = document.createElement("div");
                points.className = "knockout-points";

                const earnedPoints = Number(prediction.earned_points);
                points.textContent = `${earnedPoints > 0 ? "+" : ""}${earnedPoints} p`;

                cell.appendChild(points);
            }

            row.appendChild(cell);
        });

        list.appendChild(row);
    });

    scrollWrapper.appendChild(list);
    mainContainer.appendChild(scrollWrapper);
}


// ==================== START ====================

loadStandings();
loadPointsChart();
loadAllPredictions();
loadAllKnockoutQuestions();