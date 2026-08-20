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

let pointsChart;
let chartMode = "points";
let chartPeriod = "all";


async function loadPointsChart() {
    try {
        const response = await fetch("/api/user/standings_history", { credentials: "same-origin" });
        if (!response.ok) throw new Error("Kunde inte hämta poänghistorik");

        const { current_user, data: history } = await response.json();
        const now = new Date();
        const filteredHistory = chartPeriod === "all"
            ? history
            : history.filter(x => now - new Date(x.date) <= chartPeriod * 24 * 60 * 60 * 1000);

        const canvas = document.getElementById("points-chart");

        if (pointsChart) pointsChart.destroy();

        const users = [...new Map(filteredHistory.map(x => [x.user_id, { id: x.user_id, username: x.username }])).values()];
        const dates = [...new Set(filteredHistory.map(x => x.date))];
        const snapshots = dates.map(date => filteredHistory.filter(x => x.date === date).sort((a, b) => b.points - a.points));

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
            borderWidth: user.id === current_user ? 4 : 2,
            pointRadius: user.id === current_user ? 4 : 2,
        }));

        pointsChart = new Chart(canvas, {
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
                        title: { display: true, text: chartMode === "points" ? "Poäng" : "Placering" }
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

document.getElementById("points-toggle").addEventListener("click", () => {
    if (chartMode !== "points") {
        chartMode = "points";
        updateChartMode();
    }
});

document.getElementById("rank-toggle").addEventListener("click", () => {
    if (chartMode !== "rank") {
        chartMode = "rank";
        updateChartMode();
    }
});

function updateChartMode() {
    const pointsBtn = document.getElementById("points-toggle");
    const rankBtn = document.getElementById("rank-toggle");

    pointsBtn.className = chartMode === "points" ? "btn" : "btn btn-secondary";
    rankBtn.className = chartMode === "rank" ? "btn" : "btn btn-secondary";

    loadPointsChart();
}

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
        const matchInfo=document.createElement("div");
        matchInfo.className="all-preds-match-info";

        const teams=document.createElement("div");
        teams.className="all-preds-teams";

        const homeTeam=document.createElement("div");
        homeTeam.textContent=match.home_team;

        const awayTeam=document.createElement("div");
        awayTeam.textContent=match.away_team;

        teams.appendChild(homeTeam);
        teams.appendChild(awayTeam);

        const result=document.createElement("div");
        result.className="all-preds-result";

        const resultHome=document.createElement("div");
        resultHome.textContent=match.result_home_score??"–";

        const resultAway=document.createElement("div");
        resultAway.textContent=match.result_away_score??"–";

        result.appendChild(resultHome);
        result.appendChild(resultAway);

        matchInfo.appendChild(teams);
        matchInfo.appendChild(result);

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
                    const score=document.createElement("div");
                    score.className="all-preds-score";

                    const home=document.createElement("div");
                    home.textContent=h;

                    const away=document.createElement("div");
                    away.textContent=a;

                    score.appendChild(home);
                    score.appendChild(away);
                    cell.appendChild(score);

                    if(prediction.points!==null&&prediction.points!==undefined){
                        const p=Number(prediction.points);

                        if(!Number.isNaN(p)){
                            const points=document.createElement("div");
                            points.className="all-preds-points";
                            points.textContent=`${p>0?"+":""}${p} p`;
                            cell.appendChild(points);
                        }
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

            const score=document.createElement("div");
            score.className="all-preds-score";

            const home=document.createElement("div");
            home.textContent=h;

            const away=document.createElement("div");
            away.textContent=a;

            score.appendChild(home);
            score.appendChild(away);
            cell.appendChild(score);

            if(prediction.points!==null&&prediction.points!==undefined){
                const p=Number(prediction.points);

                if(!Number.isNaN(p)){
                    const points=document.createElement("div");
                    points.className="all-preds-points";
                    points.textContent=`${p>0?"+":""}${p} p`;
                    cell.appendChild(points);
                }
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
function setIsolatedPredictionResultClass(cell,predictionHome,predictionAway,match){
    const resultExists=match.result_home_score!==null&&match.result_away_score!==null;
    if(!resultExists)return;

    const resultHome=Number(match.result_home_score);
    const resultAway=Number(match.result_away_score);

    if(predictionHome===resultHome&&predictionAway===resultAway){
        cell.classList.add("all-preds-exact");
        return;
    }

    if(predictionHome-predictionAway===resultHome-resultAway){
        cell.classList.add("all-preds-goaldiff");
        return;
    }

    if(getMatchOutcome(predictionHome,predictionAway)===getMatchOutcome(resultHome,resultAway)){
        cell.classList.add("all-preds-winner");
        return;
    }

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

function getPointsClass(points){
    if(points>=3)return"all-preds-exact";
    if(points===2)return"all-preds-goaldiff";
    if(points===1)return"all-preds-winner";
    return"prediction-points-wrong";
}
loadAllPredictions();


async function loadAllKnockoutQuestions(){
    const response = await fetch("/api/user/knockout_questions");

    if (!response.ok){
        throw new Error("Kunde inte hämta utslagsfrågorna");
    }

    knockoutPredictions = await response.json();
    renderAllKnockoutQuestions();
}

loadAllKnockoutQuestions();


function renderAllKnockoutQuestions(){
    const mainContainer=document.getElementById("knockout-questions");
    mainContainer.innerHTML="";
    mainContainer.className="knockout-wrapper";

    if(knockoutPredictions.length===0){
        const message=document.createElement("p");
        message.className="knockout-no-questions";
        message.textContent="Det finns inga utslagsfrågor ännu.";
        mainContainer.appendChild(message);
        return;
    }

    const users=[];
    knockoutPredictions.forEach(prediction=>{
        if(!users.some(user=>user.id===prediction.user_id)){
            users.push({id:prediction.user_id,username:prediction.username});
        }
    });

    const questionIds=[...new Set(knockoutPredictions.map(prediction=>prediction.question_id))];

    const scrollWrapper=document.createElement("div");
    scrollWrapper.className="knockout-scroll";

    const list=document.createElement("div");
    list.className="knockout-list-container";
    list.style.setProperty("--user-count",users.length);

    const headerRow=document.createElement("div");
    headerRow.className="knockout-row knockout-header-row";

    const questionHeader=document.createElement("div");
    questionHeader.className="knockout-question-header";
    questionHeader.textContent="Fråga";
    headerRow.appendChild(questionHeader);

    const answerHeader=document.createElement("div");
    answerHeader.className="knockout-answer-header";
    answerHeader.textContent="Svar";
    headerRow.appendChild(answerHeader);

    users.forEach(user=>{
        const userHeader=document.createElement("div");
        userHeader.className="knockout-header-name";
        userHeader.textContent=user.id===myUserId?"Du":user.username;
        headerRow.appendChild(userHeader);
    });

    list.appendChild(headerRow);

    questionIds.forEach(questionId=>{
        const questionPredictions=knockoutPredictions.filter(prediction=>prediction.question_id===questionId);
        const question=questionPredictions[0];

        const questionRow=document.createElement("div");
        questionRow.className="knockout-row knockout-question-row";

        const questionInfo=document.createElement("div");
        questionInfo.className="knockout-question-info";
        questionInfo.textContent=question.question;
        questionRow.appendChild(questionInfo);

        const correctAnswer=document.createElement("div");
        correctAnswer.className="knockout-correct-answer";
        correctAnswer.textContent=question.correct_answer??"–";
        questionRow.appendChild(correctAnswer);

        users.forEach(user=>{
            const cell=document.createElement("div");
            cell.className="knockout-cell";

            const prediction=questionPredictions.find(p=>p.user_id===user.id);

            if(user.id===myUserId){
                cell.classList.add("knockout-cell-my");
            }

            const startDate=new Date(`${question.start_date}T00:00:00`);
            const startDatePassed=new Date()>=startDate;

            if(user.id!==myUserId&&!startDatePassed){
                cell.classList.add("knockout-cell-locked");
                cell.innerHTML=`
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                        <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                        <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                        <circle cx="12" cy="15.5" r="1"></circle>
                    </svg>`;
                questionRow.appendChild(cell);
                return;
            }

            if(!prediction||prediction.prediction===null){
                cell.textContent="–";
                questionRow.appendChild(cell);
                return;
            }

            const answer=document.createElement("div");
            answer.className="knockout-answer";
            answer.textContent=prediction.prediction;
            cell.appendChild(answer);

            if(prediction.correct_answer!==null&&prediction.correct_answer!==undefined&&prediction.earned_points!==null&&prediction.earned_points!==undefined){
                const correct=prediction.prediction.trim().toLowerCase()===prediction.correct_answer.trim().toLowerCase();

                cell.classList.add(correct?"knockout-correct":"knockout-wrong");

                const points=document.createElement("div");
                points.className="knockout-points";

                const earnedPoints=Number(prediction.earned_points);
                points.textContent=`${earnedPoints>0?"+":""}${earnedPoints} p`;

                cell.appendChild(points);
            }

            questionRow.appendChild(cell);
        });

        list.appendChild(questionRow);
    });

    scrollWrapper.appendChild(list);
    mainContainer.appendChild(scrollWrapper);
}