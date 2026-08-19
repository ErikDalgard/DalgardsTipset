import { setupToggleCard, hideCard } from "./ui.js";

// --- SPELARE ---

let editingUserId = null;

export async function setupUserManagement(){
    setupToggleCard(
    "btn-show-edit-user-list",
    "user-list-card",
    "cancel-card-user-layout"
    );

    // Funktion för att editera användare mode

    function startEditUsers(user) {
    editingUserId = user.id;

    document.getElementById("user-id").value = user.id;

    document.getElementById("user-username").value = user.username;

    // Lösenord ska vara tomt vid redigering
    document.getElementById("user-password").value = "";

    document.getElementById("user-is-admin").checked = !!user.is_admin;

    document.getElementById("user-form-title").textContent = "Redigera en spelare";

    document.getElementById("user-submit-btn").textContent = "Spara ändringar";
    document.getElementById("user-submit-btn").textContent = "Spara ändringar";
    document.getElementById("cancel-edit-user-btn").hidden = false;
    document.getElementById('delete-edit-user-btn').hidden = false;
    document.getElementById("password-help").textContent = "Lämna tomt för att behålla nuvarande lösenord.";

    // Scrolla upp till formuläret
    document.getElementById("user-form").scrollIntoView({
        behavior: "smooth"
    });
    }

    // Funktion för att gå ut från editeringsmode
    function cancelEditUser() {
    editingUserId = null;

    document.getElementById("user-form").reset();

    document.getElementById("user-form-title").textContent = "Skapa spelare";
    document.getElementById("user-submit-btn").textContent = "Skapa spelare";
    document.getElementById("cancel-edit-user-btn").hidden = true;
    document.getElementById('delete-edit-user-btn').hidden = true;


    document.getElementById("password-help").textContent = "Krävs när en ny spelare skapas.";
    document.getElementById("user-error-message").textContent = "";

    hideCard(
        "btn-show-edit-user-list",
        "user-list-card",
        "cancel-card-user-layout"
    );
    }


    // Funktionen som renderar alla användare
    async function loadUsers() {
    const response = await fetch("/api/admin/users", { credentials: "same-origin" });
    const users = await response.json();

    const list = document.getElementById("user-list");
    list.innerHTML = "";
    list.className = "list";
    users.forEach(u => {
        const li = document.createElement("li");

        const name = document.createElement("span")
        name.textContent = `${u.username}${u.is_admin ? " (admin)" : ""}`;


        const button = document.createElement("button");
        button.textContent = "Redigera"
        button.className = "btn btn-secondary"

        button.addEventListener("click", () =>{
            const card = document.getElementById("user-list-card");
            card.hidden = false;

            const button_show = document.getElementById("btn-show-edit-user-list");
            button_show.hidden = true;

        startEditUsers(u);

        });

        li.appendChild(name);
        li.appendChild(button);

        list.appendChild(li);

    });
    }
    document.getElementById("cancel-edit-user-btn").addEventListener("click", cancelEditUser);
    document.getElementById("delete-edit-user-btn").addEventListener("click", async ()=>{
        if (editingUserId === null){
        return;
        }


    //Dubbelkolla att man vill ta bort data
    const confirmed = confirm(
        "Är du säker på att du vill radera spelaren?"
    );

    if (!confirmed){
        return;
    }



    const response = await fetch("/api/admin/users",{
        method: "DELETE",
        headers: {
        "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
        id: editingUserId
        })
    });
    if (!response.ok){
        const data = await response.json();
        const errorMessage = document.getElementById("user-error-message");
        errorMessage.textContent = data.error || "Kunde inte radera spelaren";
        return;

    }
    cancelEditUser();
    await loadUsers();
    showToast("Spelaren har raderats!", "error")
    })

    //Klickar man spara så skickas ett api request för att antingen skapa, ändra eller radera en användare
    document.getElementById("user-form").addEventListener("submit", async (event) => {

        event.preventDefault();
        const errorMessage = document.getElementById("user-error-message");

        errorMessage.textContent = "";

        const username =
        document.getElementById("user-username").value.trim();

        const password =
        document.getElementById("user-password").value;

        const is_admin =
        document.getElementById("user-is-admin").checked;

        // REDIGERA
        if (editingUserId !== null) {

        const response = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: {
            "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
            id: editingUserId,
            username,
            password,
            is_admin
            })
        });

        if (!response.ok) {
            const data = await response.json();

            errorMessage.textContent =
            data.error || "Kunde inte uppdatera spelaren";

            return;
        }

        cancelEditUser();
        await loadUsers();
        showToast("Spelaren har uppdaterats");

        return;
        }

        // SKAPA
        if (!password) {
        errorMessage.textContent =
            "Lösenord krävs när en ny spelare skapas.";

        return;
        }

        const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
            username,
            password,
            is_admin
        })
        });

        if (!response.ok) {
        const data = await response.json();

        errorMessage.textContent =
            data.error || "Kunde inte skapa spelaren";

        return;
        }

        document.getElementById("user-form").reset();

        await loadUsers();
        showToast("Spelaren har skapats!")
    });


    await loadUsers();
}