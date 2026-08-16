let toastTimeout;

//Skapa en toast som bekräftelse
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  clearTimeout(toastTimeout);

  toast.textContent = message;

  toast.className = `toast ${type}`;

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}