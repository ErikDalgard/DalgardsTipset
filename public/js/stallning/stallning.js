async function loadStandings() {
    const list = document.getElementById("standings-list");

    try {
        const response = await fetch("/api/user/standings", {
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Kunde inte hämta ställningen");
        }

        const data = await response.json();

        const standings = data.standings;
        const currentUserId = data.current_user_id;

        list.innerHTML = "";

        standings.forEach((player, index) => {
            const li = document.createElement("li");
            li.className = "standings-item";

            const position = document.createElement("span");
            position.className = "standings-position";
            if (player.id === currentUserId) {
                li.classList.add("current-user");
            }

            if (index === 0) {
                position.textContent = "🥇";
            } else if (index === 1) {
                position.textContent = "🥈";
            } else if (index === 2) {
                position.textContent = "🥉";
            } else {
                position.textContent = `${index + 1}.`;
            }

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

        list.innerHTML = `
            <p class="error">
                Kunde inte hämta ställningen
            </p>
        `;
    }
}

loadStandings();

async function loadPointsChart() {
    try {
        const response = await fetch("/api/user/standings_history", {
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Kunde inte hämta poänghistorik");
        }

        const history = await response.json();

        console.log(history);

        const canvas = document.getElementById("points-chart");

        // Hämta alla unika användare
        const users = [
            ...new Map(
                history.map(item => [
                    item.user_id,
                    {
                        id: item.user_id,
                        username: item.username
                    }
                ])
            ).values()
        ];

        // Hämta alla unika datum
        const dates = [
            ...new Map(
                history.map(item => [
                    item.date,
                    item.date
                ])
            ).values()
        ];

        const datasets = users.map(user => ({
            label: user.username,

            data: dates.map(date => {
                const player = history.find(
                    item =>
                        item.user_id === user.id &&
                        item.date === date
                );

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
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Poäng"
                        }
                    },

                    x: {
                        title: {
                            display: true,
                            text: "Datum"
                        }
                    }
                },

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });

    } catch (err) {
        console.error("Poänggraf FEL:", err);
    }
}

loadPointsChart();