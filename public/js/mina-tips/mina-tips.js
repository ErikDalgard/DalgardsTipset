let matches = [];
let showOnlyOpen = true;


// HÄMTAR ALLA MATCHER
async function loadMatches() {
    const response = await fetch("api/user/matches");

    if (!response.ok) {
        throw new Error("Kunde inte hämta matcher");
    }

    matches = await response.json();

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

    button.textContent = showOnlyOpen ? "Alla matcher" : "Att tippa";

    renderMatches();
});


loadMatches();