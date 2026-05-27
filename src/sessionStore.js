const session = require("express-session");
const createMemoryStoreFactory = require("memorystore");
const createMySqlStoreFactory = require("express-mysql-session");

function buildMemorySessionStore() {
  const MemoryStore = createMemoryStoreFactory(session);
  return {
    mode: "memory",
    store: new MemoryStore({
      checkPeriod: 24 * 60 * 60 * 1000,
    }),
  };
}

function buildMySqlSessionStore(databaseConfig) {
  const MySqlSessionStore = createMySqlStoreFactory(session);
  return {
    mode: "mysql",
    store: new MySqlSessionStore({
      ...databaseConfig,
      createDatabaseTable: true,
    }),
  };
}

function createSessionStore({ sessionStoreMode, persistenceMode, databaseConfig }) {
  const mode = String(sessionStoreMode ?? "auto").toLowerCase();
  if (mode === "mysql") {
    return buildMySqlSessionStore(databaseConfig);
  }
  if (mode === "memory") {
    return buildMemorySessionStore();
  }
  if (persistenceMode === "mysql") {
    return buildMySqlSessionStore(databaseConfig);
  }
  return buildMemorySessionStore();
}

module.exports = {
  createSessionStore,
};
