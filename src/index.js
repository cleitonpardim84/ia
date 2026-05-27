const mysql = require("mysql2/promise");
const { createApp } = require("./createApp");
const { createMemoryStore } = require("./store/memoryStore");
const { createMySqlStore } = require("./store/mysqlStore");
require("dotenv").config();

function getDatabaseConfig() {
  return {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "root",
    database: process.env.DB_NAME ?? "gestao_criatopo",
  };
}

async function buildStore() {
  const storeMode = (process.env.STORE_MODE ?? "mysql").toLowerCase();
  if (storeMode === "memory") {
    return createMemoryStore();
  }

  const pool = mysql.createPool({
    ...getDatabaseConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  await pool.query("SELECT 1");
  return createMySqlStore(pool);
}

async function startServer() {
  const store = await buildStore();
  const app = createApp({
    store,
    sessionSecret: process.env.SESSION_SECRET ?? "trocar-em-producao",
  });

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Gestao Criatopo ativa em http://localhost:${port}`);
    console.log(`Modo de persistencia: ${store.mode}`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar aplicacao:", error.message);
  process.exit(1);
});
