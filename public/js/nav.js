const navToggle = document.getElementById("nav-toggle");
const siteNav = document.getElementById("site-nav");

navToggle.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

// Stänger menyn automatiskt när man klickar en länk
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
  });
});