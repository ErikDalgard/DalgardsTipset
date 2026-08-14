(async () => {
  const user = await requireAuth();
  if (!user) return; // requireAuth har redan skickat vidare till login
  document.getElementById("status").textContent = `Inloggad som ${user.username}`;
})();