


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