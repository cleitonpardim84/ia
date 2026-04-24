const form = document.getElementById("form-inscricao");
const feedback = document.getElementById("feedback");

if (form && feedback) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const nome = formData.get("nome");

    feedback.textContent = `Inscricao enviada com sucesso, ${nome}. Em breve entraremos em contato.`;
    form.reset();
  });
}
