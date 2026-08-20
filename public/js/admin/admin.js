import { setupUserManagement } from "./users.js";
import { setupTournamentManagement } from "./tournaments.js";
import { setupTeamManagement } from "./teams.js";
import { setupMatchManagement } from "./matches.js";
import { setupQuestionManagement } from "./questions.js"

(async () => {
  const user = await requireAuth();
  if (!user) return;

  if(!user.is_admin){
      document.body.innerHTML=`
          <main class="login-page">
              <div class="login-brand">
                  <img src="/icons/logo.png" alt="Dalgardstipset">
              </div>

              <div class="login-card access-denied-card">
                  <div class="access-denied-icon">🚫</div>

                  <h1>Hörredu!</h1>

                  <p>Ajabaja, här får du inte vara...</p>

                  <p class="access-denied-text">
                      Du är ju inte admin!.
                  </p>

                  <a href="/" class="btn login-btn">
                      Tillbaka
                  </a>
              </div>
          </main>
      `;
      return;
  }

})();

// Starta admin-delarna efter auth
await setupUserManagement();
await setupTournamentManagement();
await setupTeamManagement();
await setupMatchManagement();
await setupQuestionManagement();
