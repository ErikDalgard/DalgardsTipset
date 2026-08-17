import { setupUserManagement } from "./users.js";
import { setupTournamentManagement } from "./tournaments.js";
import { setupTeamManagement } from "./teams.js";
import { setupMatchManagement } from "./matches.js";

(async () => {
  const user = await requireAuth();
  if (!user) return;

  if (!user.is_admin) {
    document.body.innerHTML = "<p>Du har inte behörighet att se den här sidan.</p>";
    return;
  }

})();

// Starta admin-delarna efter auth
await setupUserManagement();
await setupTournamentManagement();
await setupTeamManagement();
await setupMatchManagement();
