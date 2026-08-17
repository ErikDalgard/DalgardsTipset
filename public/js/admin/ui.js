//Fuktioner för att visa / dölja redigeringsinställningar
export function setupToggleCard(showButtonId, cardId, cancelButtonId) {
  const showButton = document.getElementById(showButtonId);
  const card = document.getElementById(cardId);
  const cancelButton = document.getElementById(cancelButtonId);

  showButton.addEventListener("click", () => {
    card.hidden = false;
    showButton.hidden = true;
    cancelButton.hidden = false;
  });

  cancelButton.addEventListener("click", () => {
    hideCard(showButtonId, cardId, cancelButtonId);
  });
}

export function hideCard(showButtonId, cardId, cancelButtonId) {
  const card = document.getElementById(cardId);
  const showButton = document.getElementById(showButtonId);
  const cancelButton = document.getElementById(cancelButtonId);

  card.hidden = true;
  showButton.hidden = false;
  cancelButton.hidden = true;
}