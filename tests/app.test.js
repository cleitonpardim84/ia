const request = require("supertest");
const { createApp } = require("../src/createApp");
const { createMemoryStore } = require("../src/store/memoryStore");

function buildTestContext() {
  const store = createMemoryStore();
  const app = createApp({ store, sessionSecret: "test-secret" });
  return {
    store,
    app,
    agent: request.agent(app),
  };
}

describe("Gestao Criatopo app", () => {
  test("exibe saude da aplicacao com store de sessao", async () => {
    const { agent } = buildTestContext();
    const response = await agent.get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      store: "memory",
      session_store: "memory",
    });
  });

  test("nao exibe opcao de criar usuario na tela de login", async () => {
    const { agent } = buildTestContext();
    const response = await agent.get("/login");

    expect(response.status).toBe(200);
    expect(response.text).not.toContain("Crie seu usuario");
    expect(response.text).not.toContain("href=\"/register\"");
  });

  test("redireciona para login quando nao autenticado", async () => {
    const { agent } = buildTestContext();
    const response = await agent.get("/dashboard");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");
  });

  test("permite cadastro, login e gestao completa no dashboard", async () => {
    const { agent } = buildTestContext();

    const registerResponse = await agent.post("/register").type("form").send({
      username: "admin",
      password: "123456",
    });
    expect(registerResponse.status).toBe(302);
    expect(registerResponse.headers.location).toContain("/dashboard");

    const createEmployeeResponse = await agent.post("/employees").type("form").send({
      name: "Ana Souza",
      email: "ana@criatopo.com",
      department: "Financeiro",
    });
    expect(createEmployeeResponse.status).toBe(302);

    const createClientResponse = await agent.post("/clients").type("form").send({
      name: "Carlos Lima",
      email: "carlos@cliente.com",
      company: "Cliente Exemplo LTDA",
    });
    expect(createClientResponse.status).toBe(302);

    const createSupplierResponse = await agent.post("/suppliers").type("form").send({
      name: "Global Office",
      contact: "suporte@globaloffice.com",
      service: "Materiais",
    });
    expect(createSupplierResponse.status).toBe(302);

    const createTaskResponse = await agent.post("/tasks").type("form").send({
      title: "Preparar proposta comercial",
      owner: "Ana Souza",
      status: "Em andamento",
      dueDate: "2026-06-01",
    });
    expect(createTaskResponse.status).toBe(302);

    const dashboardResponse = await agent.get("/dashboard");
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.text).toContain("Gestão Criatopo");
    expect(dashboardResponse.text).toContain("Ana Souza");
    expect(dashboardResponse.text).toContain("Carlos Lima");
    expect(dashboardResponse.text).toContain("Global Office");
    expect(dashboardResponse.text).toContain("Preparar proposta comercial");
    expect(dashboardResponse.text).toContain("Resumo operacional");
  });
});
