const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".module-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("is-active"));
    panels.forEach((panel) => panel.classList.remove("is-active"));

    tab.classList.add("is-active");
    document.getElementById(tab.dataset.module).classList.add("is-active");
  });
});

const userForm = document.getElementById("user-form");
const userFeedback = document.getElementById("user-feedback");

userForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(userForm);
  userFeedback.textContent = `${data.get("name")} guardado com permissoes atualizadas.`;
});

const notifyButton = document.getElementById("notify-button");
const notifyOutput = document.getElementById("notify-output");

notifyButton.addEventListener("click", () => {
  notifyOutput.textContent = "Notificacao enviada para Comercial, Producao e Financeiro.";
});

const quoteForm = document.getElementById("quote-form");
const quoteResult = document.getElementById("quote-result");

function formatEuro(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(quoteForm);
  const cost = Number(data.get("cost")) || 0;
  const margin = Number(data.get("margin")) || 0;
  const vat = Number(data.get("vat")) || 0;
  const priceWithoutVat = cost * (1 + margin / 100);
  const priceWithVat = priceWithoutVat * (1 + vat / 100);

  quoteResult.textContent = `Preco venda: ${formatEuro(priceWithVat)}`;
});

let draggedCard = null;

document.querySelectorAll(".job-card").forEach((card) => {
  card.addEventListener("dragstart", () => {
    draggedCard = card;
    card.setAttribute("aria-grabbed", "true");
  });

  card.addEventListener("dragend", () => {
    card.setAttribute("aria-grabbed", "false");
    draggedCard = null;
  });
});

document.querySelectorAll(".kanban-column").forEach((column) => {
  column.addEventListener("dragover", (event) => {
    event.preventDefault();
    column.classList.add("is-over");
  });

  column.addEventListener("dragleave", () => {
    column.classList.remove("is-over");
  });

  column.addEventListener("drop", () => {
    column.classList.remove("is-over");
    if (draggedCard) {
      column.appendChild(draggedCard);
    }
  });
});
