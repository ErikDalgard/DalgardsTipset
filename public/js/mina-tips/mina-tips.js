let matches = [];
let predictionMap = new Map();
let showOnlyOpen = true;


let questions = [];

// HÄMTAR ALLA MATCHER & predictions
async function loadMatches() {
    const [matchesResponse, predictionsResponse] = await Promise.all([
        fetch("/api/user/matches", { credentials: "same-origin" }),
        fetch("/api/user/match_predictions", { credentials: "same-origin" })
    ]);

    if (!matchesResponse.ok) {
        throw new Error("Kunde inte hämta matcher");
    }

    if (!predictionsResponse.ok) {
        throw new Error("Kunde inte hämta predictions");
    }

    matches = await matchesResponse.json();
    const predictions = await predictionsResponse.json();

    predictionMap = new Map(
        predictions.map(p => [p.match_id, p])
    );

    renderMatches();
}

// RENDERAR MATCHER
function renderMatches() {
    const list = document.getElementById("match-list");
    list.innerHTML = "";
    list.className = "list";

    let currentDate = null;
    let dateGroup = null;

    const filteredMatches = showOnlyOpen
        ? matches.filter(u => new Date() < new Date(u.deadline_at))
        : matches;

    if (filteredMatches.length === 0){
        const message = document.createElement("p");
        message.className = "no-matches-message";
        message.textContent = showOnlyOpen ? "Du har inga öppna matcher att tippa just nu" : "Det finns inga matcher";

        list.appendChild(message);
        return;
    }
    filteredMatches.forEach(u => {
        const date = new Date(u.kickoff_at);
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

        const li = document.createElement("li");
        li.className = "match-item";

        // MATCH
        const game = document.createElement("span");
        game.className = "match-teams";
        game.textContent = `${u.home_team} vs ${u.away_team}`;

        // TID
        const time = document.createElement("span");
        time.className = "match-time";
        time.textContent = date.toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit"
        });

        // GISSNING
        const prediction = document.createElement("div");
        prediction.className = "prediction";

        const homePrediction = document.createElement("input");
        homePrediction.type = "number";
        homePrediction.min = "0";
        homePrediction.className = "prediction-input";

        const separator = document.createElement("span");
        separator.textContent = "–";

        const awayPrediction = document.createElement("input");
        awayPrediction.type = "number";
        awayPrediction.min = "0";
        awayPrediction.className = "prediction-input";

        const existingPrediction = predictionMap.get(u.id);
        if (existingPrediction){
            homePrediction.value = existingPrediction.home_score;
            awayPrediction.value = existingPrediction.away_score;
        }

        function savePrediction() {
            if (homePrediction.value === "" || awayPrediction.value === "") {
                return;
            }

            savePredictionToApi(
                u.id,
                homePrediction.value === "" ? null : Number(homePrediction.value),
                awayPrediction.value === "" ? null : Number(awayPrediction.value)
            );
        }

        homePrediction.addEventListener("change", savePrediction);
        awayPrediction.addEventListener("change", savePrediction);

        // DEADLINE
        const isLocked = new Date() >= new Date(u.deadline_at);

        homePrediction.disabled = isLocked;
        awayPrediction.disabled = isLocked;

        // LÅS
        const lock = document.createElement("span");
        lock.className = "prediction-lock";

        lock.innerHTML = isLocked
            ? `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    aria-label="Tips låst">
                    <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                    <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                    <circle cx="12" cy="15.5" r="1"></circle>
                </svg>
            `
            : `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    aria-label="Tips öppet">
                    <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                    <path d="M7 10V7a5 5 0 0 1 9.9-1"></path>
                    <circle cx="12" cy="15.5" r="1"></circle>
                </svg>
            `;

        prediction.appendChild(homePrediction);
        prediction.appendChild(separator);
        prediction.appendChild(awayPrediction);
        prediction.appendChild(lock);

        li.appendChild(time);
        li.appendChild(game);
        li.appendChild(prediction);

        dateGroup.appendChild(li);
    });
}


// FILTER-KNAPP
document.getElementById("filter-predictions-btn").addEventListener("click", () => {
    showOnlyOpen = !showOnlyOpen;

    const button = document.getElementById("filter-predictions-btn");

    button.textContent = showOnlyOpen ? "Visa alla" : "Att tippa";
    renderMatches();
});


async function savePredictionToApi(matchId, homeScore, awayScore) {
    try {
        const response = await fetch("/api/user/match_predictions", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                match_id: matchId,
                home_score: homeScore,
                away_score: awayScore
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(data.error || "Kunde inte spara tipset");
            return;
        }
        showToast("Sparat!")
    } catch (error) {
        console.error("Fel vid sparande av prediction:", error);
    }
}

loadMatches();


loadQuestions();

// HÄMTAR ALLA Utslagsfrågor & dess predictions
async function loadQuestions() {
    const response = await fetch(
        "/api/user/prediction_questions",
        {
            credentials: "same-origin"
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error(
            data.error || "Kunde inte hämta utslagsfrågorna"
        );
        return;
    }

    questions = data;
    console.log(questions);

    renderQuestions();
}

function renderQuestions() {
    const list = document.getElementById("question-list");

    list.innerHTML = "";
    list.className = "list";

    if (questions.length === 0) {
        const message = document.createElement("p");
        message.className = "no-questions-message";
        message.textContent = "Det finns inga utslagsfrågor.";

        list.appendChild(message);
        return;
    }

    questions.forEach(question => {
        const li = document.createElement("li");
        li.className = "question-item";

        // FRÅGAN
        const label = document.createElement("span");
        label.className = "question-label";
        label.textContent = question.label;

        // SVAR
        const input = document.createElement("input");
        input.type = "text";
        input.className = "question-input";
        input.placeholder = "Ditt svar";

        // Om frågan redan har ett svar
        if (question.answer) {
            input.value = question.answer;
        }

        // DATUMET HAR PASSERAT -> LÅST
        const isLocked = new Date() >= new Date(question.start_date);

        input.disabled = isLocked;

        // Spara när användaren ändrar svaret
        input.addEventListener("change", () => {
            saveQuestionPrediction(
                question.id,
                input.value.trim()
            );
        });

        // LÅS / OLÅS
        const lock = document.createElement("span");
        lock.className = "prediction-lock";

        lock.innerHTML = isLocked
            ? `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    aria-label="Utslagsfråga låst">
                    <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                    <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                    <circle cx="12" cy="15.5" r="1"></circle>
                </svg>
            `
            : `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    aria-label="Utslagsfråga öppen">
                    <rect x="3" y="10" width="18" height="11" rx="2"></rect>
                    <path d="M7 10V7a5 5 0 0 1 9.9-1"></path>
                    <circle cx="12" cy="15.5" r="1"></circle>
                </svg>
            `;

        li.appendChild(label);
        li.appendChild(input);
        li.appendChild(lock);

        list.appendChild(li);
    });
}
async function saveQuestionPrediction(questionId, answer) {
    if (!answer) {
        return;
    }

    try {
        const response = await fetch(
            "/api/user/prediction_answers",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    question_id: questionId,
                    answer: answer
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                data.error || "Kunde inte spara svaret"
            );
            return;
        }

        showToast("Sparat!");

    } catch (error) {
        console.error(
            "Fel vid sparande av utslagsfråga:",
            error
        );
    }
}
