const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "root",
    database: process.env.DB_NAME ?? "gestao_criatopo",
    multipleStatements: true,
  });

  await connection.query(schemaSql);
  await connection.end();
  console.log("Schema MySQL aplicada com sucesso.");
}

main().catch((error) => {
  console.error("Erro ao aplicar schema:", error.message);
  process.exit(1);
});
