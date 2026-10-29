
(() => {
  const grid = document.getElementById("selected-work-grid");
  if (!grid) return;

  const buttons = document.querySelectorAll(".work-filter");
  const cards = grid.querySelectorAll(".work-card");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      buttons.forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      cards.forEach(card => {
        const matches =
          filter === "all" || card.dataset.category === filter;

        card.hidden = !matches;
      });
    });
  });
})();
