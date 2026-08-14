async function requireAuth() {
// Kolla om jag är inloggad
  const response = await fetch("/api/me", { credentials: "same-origin" });

  //om inte kasta tillbaka till login sida
  if (!response.ok) {
    window.location.href = "/login.html";
    return null;
  }

  return response.json(); 
}