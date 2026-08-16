(async () => {
  const user = await requireAuth();
  if (!user) return; // requireAuth har redan skickat vidare till login
  document.getElementById("status").textContent = `Hej ${user.username}!`;
})();


document.getElementById("logout-btn").addEventListener("click", logout);
document.getElementsById("admin-btn").addEventListener("click", () => {
  window.location.href = "admin.html";
})