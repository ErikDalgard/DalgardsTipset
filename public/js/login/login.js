const form = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // hindra sidan från att ladda om vid submit

  errorMessage.textContent = "";

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin", // viktigt: gör att cookien sparas
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const data = await response.json();
    errorMessage.textContent = data.error || "Något gick fel";
    return;
  }

  // Inloggning lyckades → skicka vidare till startsidan
  window.location.href = "/";
});

document.getElementById("forgot-password-link").addEventListener("click", async ()=>{

  const response = await fetch("/api/user/admin-contact", {credentials: "same-origin"});
  const data = await response.json()

  showToast(`Kontakta admin ${data.username}!`, "error");
})