(async () => {
  // Skicka tillbaka person till log in sida om de ej är inloggade
  const user = await requireAuth();
  if (!user) return; 
  document.getElementById("status").textContent = getGreeting(user.username);
})();


//Navigering
document.getElementById("logout-btn").addEventListener("click", logout);
document.getElementsById("admin-btn").addEventListener("click", () => {
  window.location.href = "admin.html";
})


// Hälsningsfunction
function getGreeting(username){
  const hour = new Date().getHours();

  if (hour >= 6 && hour <= 11){
    return `God morgon ${username}`;
  }

  if (hour >= 11 && hour < 17) {
    return `Hej ${username}!`;
  }

  if (hour >= 17 && hour < 22) {
    return `God kväll ${username}!`;
  }

  return `God natt ${username}!`;
}