function createMemoryStore() {
  const users = [];
  const employees = [];
  const clients = [];
  let userId = 1;
  let employeeId = 1;
  let clientId = 1;

  return {
    mode: "memory",

    async findUserByUsername(username) {
      return users.find((user) => user.username === username) ?? null;
    },

    async createUser({ username, passwordHash }) {
      const newUser = { id: userId++, username, password_hash: passwordHash };
      users.push(newUser);
      return newUser;
    },

    async listEmployees() {
      return [...employees];
    },

    async createEmployee({ name, email, department }) {
      employees.push({
        id: employeeId++,
        name,
        email,
        department,
      });
    },

    async deleteEmployee(id) {
      const index = employees.findIndex((employee) => employee.id === id);
      if (index !== -1) {
        employees.splice(index, 1);
      }
    },

    async listClients() {
      return [...clients];
    },

    async createClient({ name, email, company }) {
      clients.push({
        id: clientId++,
        name,
        email,
        company,
      });
    },

    async deleteClient(id) {
      const index = clients.findIndex((client) => client.id === id);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    },
  };
}

module.exports = {
  createMemoryStore,
};
