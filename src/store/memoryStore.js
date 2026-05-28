function createMemoryStore() {
  const users = [];
  const employees = [];
  const clients = [];
  const suppliers = [];
  const tasks = [];
  let userId = 1;
  let employeeId = 1;
  let clientId = 1;
  let supplierId = 1;
  let taskId = 1;

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

    async listSuppliers() {
      return [...suppliers];
    },

    async createSupplier({ name, contact, service }) {
      suppliers.push({
        id: supplierId++,
        name,
        contact,
        service,
      });
    },

    async deleteSupplier(id) {
      const index = suppliers.findIndex((supplier) => supplier.id === id);
      if (index !== -1) {
        suppliers.splice(index, 1);
      }
    },

    async listTasks() {
      return [...tasks];
    },

    async createTask({ title, owner, status, dueDate }) {
      tasks.push({
        id: taskId++,
        title,
        owner,
        status,
        due_date: dueDate,
      });
    },

    async deleteTask(id) {
      const index = tasks.findIndex((task) => task.id === id);
      if (index !== -1) {
        tasks.splice(index, 1);
      }
    },
  };
}

module.exports = {
  createMemoryStore,
};
