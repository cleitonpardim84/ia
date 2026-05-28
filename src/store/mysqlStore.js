function createMySqlStore(pool) {
  return {
    mode: "mysql",

    async findUserByUsername(username) {
      const [rows] = await pool.query(
        "SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1",
        [username],
      );
      return rows[0] ?? null;
    },

    async createUser({ username, passwordHash }) {
      const [result] = await pool.query(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        [username, passwordHash],
      );

      return {
        id: result.insertId,
        username,
        password_hash: passwordHash,
      };
    },

    async listEmployees() {
      const [rows] = await pool.query(
        "SELECT id, name, email, department FROM employees ORDER BY id DESC",
      );
      return rows;
    },

    async createEmployee({ name, email, department }) {
      await pool.query(
        "INSERT INTO employees (name, email, department) VALUES (?, ?, ?)",
        [name, email || null, department || null],
      );
    },

    async deleteEmployee(id) {
      await pool.query("DELETE FROM employees WHERE id = ?", [id]);
    },

    async listClients() {
      const [rows] = await pool.query(
        "SELECT id, name, email, company FROM clients ORDER BY id DESC",
      );
      return rows;
    },

    async createClient({ name, email, company }) {
      await pool.query(
        "INSERT INTO clients (name, email, company) VALUES (?, ?, ?)",
        [name, email || null, company || null],
      );
    },

    async deleteClient(id) {
      await pool.query("DELETE FROM clients WHERE id = ?", [id]);
    },

    async listSuppliers() {
      const [rows] = await pool.query(
        "SELECT id, name, contact, service FROM suppliers ORDER BY id DESC",
      );
      return rows;
    },

    async createSupplier({ name, contact, service }) {
      await pool.query(
        "INSERT INTO suppliers (name, contact, service) VALUES (?, ?, ?)",
        [name, contact || null, service || null],
      );
    },

    async deleteSupplier(id) {
      await pool.query("DELETE FROM suppliers WHERE id = ?", [id]);
    },

    async listTasks() {
      const [rows] = await pool.query(
        "SELECT id, title, owner, status, due_date FROM tasks ORDER BY id DESC",
      );
      return rows;
    },

    async createTask({ title, owner, status, dueDate }) {
      await pool.query(
        "INSERT INTO tasks (title, owner, status, due_date) VALUES (?, ?, ?, ?)",
        [title, owner || null, status || "Pendente", dueDate || null],
      );
    },

    async deleteTask(id) {
      await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    },
  };
}

module.exports = {
  createMySqlStore,
};
