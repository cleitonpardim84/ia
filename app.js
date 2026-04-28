const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "./api/index.php";

const STATUS_DEFS = [
  { id: "em_producao", label: "Em producao" },
  { id: "aguardando_pagamento_50", label: "Aguardando pagamento 50%" },
  { id: "pagamento_100", label: "Pagamento 100%" },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", roles: ["admin", "atendente", "producao"] },
  { id: "pedidos", label: "Pedidos", roles: ["admin", "atendente"] },
  { id: "producao", label: "Producao", roles: ["admin", "producao"] },
  { id: "stock", label: "Stock", roles: ["admin", "atendente"] },
  { id: "fornecedores", label: "Fornecedores / Tamanhos / Cores", roles: ["admin"] },
  { id: "perdas", label: "Perdas e Despesas", roles: ["admin"] },
  { id: "financeiro", label: "Lucros e Despesas", roles: ["admin"] },
];

const STATUS_MAP = STATUS_DEFS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

const ROLE_LABELS = {
  admin: "Admin",
  atendente: "Atendente",
  producao: "Producao",
};

function createInitialState() {
  return {
    session: null,
    suppliers: [],
    sizes: [],
    colors: [],
    stockItems: [],
    orders: [],
    lossEntries: [],
    counters: {
      order: 1,
      stock: 1,
      supplier: 1,
      loss: 1,
    },
  };
}

function normalizeState(rawState) {
  const base = createInitialState();
  const source = rawState && typeof rawState === "object" ? rawState : {};
  return {
    ...base,
    ...source,
    suppliers: Array.isArray(source.suppliers) ? source.suppliers : base.suppliers,
    sizes: Array.isArray(source.sizes) ? source.sizes : base.sizes,
    colors: Array.isArray(source.colors) ? source.colors : base.colors,
    stockItems: Array.isArray(source.stockItems) ? source.stockItems : base.stockItems,
    orders: Array.isArray(source.orders) ? source.orders : base.orders,
    lossEntries: Array.isArray(source.lossEntries) ? source.lossEntries : base.lossEntries,
    counters: {
      ...base.counters,
      ...(source.counters && typeof source.counters === "object" ? source.counters : {}),
    },
  };
}

async function apiCall(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : {};

  if (!response.ok) {
    const message = payload?.error || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("pt-PT");
}

function statusPill(statusId) {
  const status = STATUS_MAP[statusId] || { label: statusId };
  return `<span class="status-pill status-${statusId}">${escapeHtml(status.label)}</span>`;
}

function allowedViewsFor(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

function roleCanAccess(viewId) {
  if (!state.session) {
    return false;
  }
  const role = state.session.role;
  return allowedViewsFor(role).some((item) => item.id === viewId);
}

function showFlash(message, type = "info") {
  clearTimeout(flashTimeoutId);
  flashMessageEl.textContent = message;
  flashMessageEl.className = `flash ${type}`;
  flashMessageEl.classList.remove("hidden");
  flashTimeoutId = setTimeout(() => {
    flashMessageEl.classList.add("hidden");
  }, 3600);
}

function renderNavigation() {
  if (!state.session) {
    navEl.innerHTML = "";
    return;
  }

  const navItems = allowedViewsFor(state.session.role);
  navEl.innerHTML = navItems
    .map((item) => {
      const activeClass = activeView === item.id ? "active" : "";
      return `<button type="button" data-view="${item.id}" class="${activeClass}">${escapeHtml(item.label)}</button>`;
    })
    .join("");
}

function setActiveView(viewId) {
  if (!roleCanAccess(viewId)) {
    return;
  }
  activeView = viewId;
  renderNavigation();
  renderViewVisibility();
}

function renderViewVisibility() {
  viewIds.forEach((viewId) => {
    const element = document.getElementById(`view-${viewId}`);
    if (!element) {
      return;
    }
    if (viewId === activeView && roleCanAccess(viewId)) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  });
}

function ensureValidView() {
  if (!state.session) {
    activeView = "dashboard";
    return;
  }
  const allowed = allowedViewsFor(state.session.role);
  if (!allowed.some((item) => item.id === activeView)) {
    activeView = allowed[0].id;
  }
}

function supplierById(supplierId) {
  return state.suppliers.find((supplier) => String(supplier.id) === String(supplierId));
}

function populateSelect(element, values, mapper) {
  if (!element) {
    return;
  }
  if (!values.length) {
    element.innerHTML = '<option value="">Sem registos</option>';
    return;
  }
  element.innerHTML = values
    .map((value) => `<option value="${escapeHtml(mapper(value).value)}">${escapeHtml(mapper(value).label)}</option>`)
    .join("");
}

function refreshOptions() {
  populateSelect(orderSizeEl, state.sizes, (size) => ({ value: size, label: size }));
  populateSelect(stockSizeEl, state.sizes, (size) => ({ value: size, label: size }));

  populateSelect(orderColorEl, state.colors, (color) => ({ value: color, label: color }));
  populateSelect(stockColorEl, state.colors, (color) => ({ value: color, label: color }));

  populateSelect(orderSupplierEl, state.suppliers, (supplier) => ({
    value: supplier.id,
    label: `${supplier.name} (${supplier.city})`,
  }));
  populateSelect(stockSupplierEl, state.suppliers, (supplier) => ({
    value: supplier.id,
    label: `${supplier.name} (${supplier.city})`,
  }));
}

function computeFinance() {
  const totalPotentialRevenue = state.orders.reduce((sum, order) => sum + Number(order.salePrice) * Number(order.quantity), 0);
  const collectedRevenue = state.orders.reduce((sum, order) => {
    const orderTotal = Number(order.salePrice) * Number(order.quantity);
    if (order.status === "pagamento_100") {
      return sum + orderTotal;
    }
    if (order.status === "aguardando_pagamento_50") {
      return sum + orderTotal * 0.5;
    }
    return sum;
  }, 0);
  const productionCost = state.orders.reduce(
    (sum, order) => sum + Number(order.productionCost) * Number(order.quantity),
    0
  );
  const stockValue = state.stockItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
  const losses = state.lossEntries
    .filter((entry) => entry.entryType === "loss")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = state.lossEntries
    .filter((entry) => entry.entryType === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const netResult = collectedRevenue - productionCost - losses - expenses;

  return {
    totalPotentialRevenue,
    collectedRevenue,
    pendingRevenue: totalPotentialRevenue - collectedRevenue,
    productionCost,
    stockValue,
    losses,
    expenses,
    netResult,
  };
}

function renderDashboard() {
  const finance = computeFinance();
  const inProduction = state.orders.filter((order) => order.status === "em_producao").length;
  const waiting50 = state.orders.filter((order) => order.status === "aguardando_pagamento_50").length;
  const fullyPaid = state.orders.filter((order) => order.status === "pagamento_100").length;
  const lowStockItems = state.stockItems.filter((item) => Number(item.quantity) <= Number(item.reorderLevel));

  const cards = [
    { label: "Pedidos totais", value: state.orders.length },
    { label: "Em producao", value: inProduction },
    { label: "Aguardando 50%", value: waiting50 },
    { label: "Pagamento 100%", value: fullyPaid },
    { label: "Receita recebida", value: formatCurrency(finance.collectedRevenue) },
    { label: "Resultado liquido", value: formatCurrency(finance.netResult) },
  ];

  const alertHtml = lowStockItems.length
    ? `
      <div class="alert warn">
        <strong>Atencao ao stock:</strong>
        ${lowStockItems
          .map(
            (item) =>
              `${escapeHtml(item.name)} ${escapeHtml(item.size)}/${escapeHtml(item.color)} (qtd: ${escapeHtml(
                item.quantity
              )})`
          )
          .join(", ")}
      </div>
    `
    : '<div class="alert ok">Sem alertas de stock minimo neste momento.</div>';

  const roleTip =
    state.session?.role === "atendente"
      ? "<p class='muted'>Use o menu Pedidos para preencher o formulario online e enviar para Producao.</p>"
      : state.session?.role === "producao"
      ? "<p class='muted'>Use o menu Producao para atualizar os estados: em producao, aguardando pagamento 50% e pagamento 100%.</p>"
      : "<p class='muted'>Admin acompanha operacao, perdas e painel de lucros/despesas.</p>";

  dashboardViewEl.innerHTML = `
    <h2>Dashboard operacional</h2>
    ${roleTip}
    <div class="stats-grid">
      ${cards
        .map(
          (card) =>
            `<article class="stat-card"><p>${escapeHtml(card.label)}</p><strong>${escapeHtml(card.value)}</strong></article>`
        )
        .join("")}
    </div>
    ${alertHtml}
  `;
}

function renderOrdersTable() {
  if (!state.orders.length) {
    ordersTableBodyEl.innerHTML = '<tr><td colspan="7">Sem pedidos registados.</td></tr>';
    return;
  }
  const sorted = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  ordersTableBodyEl.innerHTML = sorted
    .map((order) => {
      const supplier = supplierById(order.supplierId);
      const total = Number(order.salePrice) * Number(order.quantity);
      return `
        <tr>
          <td>${escapeHtml(order.id)}</td>
          <td>${escapeHtml(order.clientName)}</td>
          <td>${escapeHtml(order.model)}</td>
          <td>${escapeHtml(order.size)} / ${escapeHtml(order.color)}</td>
          <td>${escapeHtml(supplier ? supplier.name : "Fornecedor removido")}</td>
          <td>${escapeHtml(formatCurrency(total))}</td>
          <td>${statusPill(order.status)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderProductionTable() {
  if (!state.orders.length) {
    productionTableBodyEl.innerHTML = '<tr><td colspan="6">Sem pedidos para producao.</td></tr>';
    return;
  }

  const sorted = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  productionTableBodyEl.innerHTML = sorted
    .map((order) => {
      const statusOptions = STATUS_DEFS.map(
        (status) =>
          `<option value="${status.id}" ${status.id === order.status ? "selected" : ""}>${escapeHtml(status.label)}</option>`
      ).join("");

      return `
        <tr>
          <td>${escapeHtml(order.id)}</td>
          <td>${escapeHtml(order.clientName)}</td>
          <td>
            ${escapeHtml(order.model)}<br />
            <small>${escapeHtml(order.quantity)} un. | ${escapeHtml(order.size)} | ${escapeHtml(order.color)}</small>
          </td>
          <td>${statusPill(order.status)}</td>
          <td>${escapeHtml(order.productionNote || "-")}</td>
          <td>
            <form class="inline-control production-update-form" data-order-id="${escapeHtml(order.id)}">
              <select name="status">${statusOptions}</select>
              <input name="note" value="${escapeHtml(order.productionNote || "")}" placeholder="Nota" />
              <button type="submit" class="btn">Atualizar</button>
            </form>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderStockTable() {
  if (!state.stockItems.length) {
    stockTableBodyEl.innerHTML = '<tr><td colspan="7">Sem itens de stock.</td></tr>';
    return;
  }

  const canDelete = state.session?.role === "admin";
  stockTableBodyEl.innerHTML = state.stockItems
    .map((item) => {
      const supplier = supplierById(item.supplierId);
      const dangerClass = Number(item.quantity) <= Number(item.reorderLevel) ? "danger-text" : "";
      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.size)} / ${escapeHtml(item.color)}</td>
          <td>${escapeHtml(supplier ? supplier.name : "Fornecedor removido")}</td>
          <td class="${dangerClass}">${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(formatCurrency(item.unitCost))}</td>
          <td>
            <form class="inline-control stock-move-form" data-stock-id="${escapeHtml(item.id)}">
              <select name="operation">
                <option value="add">Entrada</option>
                <option value="remove">Saida</option>
              </select>
              <input name="amount" type="number" min="1" step="1" value="1" required />
              <button class="btn" type="submit">Aplicar</button>
            </form>
          </td>
          <td>
            ${
              canDelete
                ? `<button type="button" class="btn danger" data-action="delete-stock" data-id="${escapeHtml(item.id)}">Remover</button>`
                : "-"
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSupplierAdmin() {
  if (!state.suppliers.length) {
    supplierTableBodyEl.innerHTML = '<tr><td colspan="4">Sem fornecedores.</td></tr>';
  } else {
    supplierTableBodyEl.innerHTML = state.suppliers
      .map(
        (supplier) => `
        <tr>
          <td>${escapeHtml(supplier.name)}</td>
          <td>${escapeHtml(supplier.contact)}</td>
          <td>${escapeHtml(supplier.city)}</td>
          <td><button class="btn danger" type="button" data-action="delete-supplier" data-id="${escapeHtml(
            supplier.id
          )}">Remover</button></td>
        </tr>
      `
      )
      .join("");
  }

  sizeListEl.innerHTML = state.sizes.map((size) => `<span class="chip">${escapeHtml(size)}</span>`).join("");
  colorListEl.innerHTML = state.colors.map((color) => `<span class="chip">${escapeHtml(color)}</span>`).join("");
}

function renderLosses() {
  if (!state.lossEntries.length) {
    lossTableBodyEl.innerHTML = '<tr><td colspan="4">Sem perdas ou despesas registadas.</td></tr>';
    return;
  }
  const sorted = [...state.lossEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  lossTableBodyEl.innerHTML = sorted
    .map((entry) => {
      const typeLabel = entry.entryType === "loss" ? "Perda" : "Despesa";
      return `
        <tr>
          <td>${escapeHtml(formatDate(entry.createdAt))}</td>
          <td>${escapeHtml(typeLabel)}</td>
          <td>${escapeHtml(entry.description)}</td>
          <td>${escapeHtml(formatCurrency(entry.amount))}</td>
        </tr>
      `;
    })
    .join("");
}

function renderFinance() {
  const finance = computeFinance();
  const cards = [
    { label: "Receita recebida", value: formatCurrency(finance.collectedRevenue) },
    { label: "Receita pendente", value: formatCurrency(finance.pendingRevenue) },
    { label: "Custo de producao", value: formatCurrency(finance.productionCost) },
    { label: "Perdas", value: formatCurrency(finance.losses) },
    { label: "Despesas", value: formatCurrency(finance.expenses) },
    { label: "Valor em stock", value: formatCurrency(finance.stockValue) },
    { label: "Resultado liquido", value: formatCurrency(finance.netResult) },
  ];
  financeCardsEl.innerHTML = cards
    .map((card) => `<article class="stat-card"><p>${escapeHtml(card.label)}</p><strong>${escapeHtml(card.value)}</strong></article>`)
    .join("");

  const ordersWaiting = state.orders.filter((order) => order.status !== "pagamento_100");
  if (!ordersWaiting.length) {
    financeDetailEl.innerHTML = "<p class='muted'>Nao existem pedidos pendentes de pagamento.</p>";
    return;
  }

  financeDetailEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Status</th>
            <th>Valor total</th>
          </tr>
        </thead>
        <tbody>
          ${ordersWaiting
            .map((order) => {
              const total = Number(order.salePrice) * Number(order.quantity);
              return `<tr>
                <td>${escapeHtml(order.id)}</td>
                <td>${escapeHtml(order.clientName)}</td>
                <td>${statusPill(order.status)}</td>
                <td>${escapeHtml(formatCurrency(total))}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSessionInfo() {
  if (!state.session) {
    sessionInfoEl.classList.add("hidden");
    return;
  }
  sessionNameEl.textContent = state.session.name;
  sessionRoleEl.textContent = ROLE_LABELS[state.session.role] || state.session.role;
  sessionInfoEl.classList.remove("hidden");
}

function renderApp() {
  if (!state.session) {
    loginSectionEl.classList.remove("hidden");
    appSectionEl.classList.add("hidden");
    renderSessionInfo();
    return;
  }

  loginSectionEl.classList.add("hidden");
  appSectionEl.classList.remove("hidden");

  ensureValidView();
  refreshOptions();
  renderSessionInfo();
  renderNavigation();
  renderDashboard();
  renderOrdersTable();
  renderProductionTable();
  renderStockTable();
  renderSupplierAdmin();
  renderLosses();
  renderFinance();
  renderViewVisibility();
}

async function persistState() {
  const payload = await apiCall("?route=state", {
    method: "PUT",
    body: JSON.stringify({ action: statePendingAction.type, data: statePendingAction.payload }),
  });
  state = normalizeState(payload.data || state);
  statePendingAction = null;
  return payload.message || "";
}

async function refreshStateFromApi() {
  const payload = await apiCall("?route=state", {
    method: "GET",
  });
  state = normalizeState(payload.data || createInitialState());
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginFormEl);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  try {
    const payload = await apiCall("?route=auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const session = payload.session;
    if (!session) {
      throw new Error("Sessao invalida recebida do servidor.");
    }
    state.session = session;
    await refreshStateFromApi();
    state.session = session;
    syncStatusEl.className = "sync-badge remote";
    syncStatusEl.textContent = "MySQL Hostinger";
    renderApp();
    showFlash(`Sessao iniciada como ${session.name}.`);
  } catch (error) {
    showFlash(error.message || "Falha no login.", "error");
  }
}

async function handleLogout() {
  try {
    await apiCall("?route=auth/logout", { method: "POST" });
  } catch (error) {
    // continue local cleanup even when session endpoint fails
  }
  state.session = null;
  renderApp();
}

async function handleNewOrder(event) {
  event.preventDefault();
  if (!roleCanAccess("pedidos")) {
    showFlash("Sem permissao para criar pedidos.", "error");
    return;
  }

  if (!state.suppliers.length || !state.sizes.length || !state.colors.length) {
    showFlash("Configure fornecedores, tamanhos e cores antes de criar pedidos.", "error");
    return;
  }

  const data = new FormData(orderFormEl);
  const quantity = Number(data.get("quantity"));
  const productionCost = Number(data.get("productionCost"));
  const salePrice = Number(data.get("salePrice"));

  if (quantity <= 0 || productionCost < 0 || salePrice < 0) {
    showFlash("Preencha quantidade e custos com valores validos.", "error");
    return;
  }

  const supplierId = String(data.get("supplierId"));
  if (!supplierById(supplierId)) {
    showFlash("Fornecedor invalido.", "error");
    return;
  }

  const order = {
    id: `PED-${state.counters.order || 1}`,
    createdAt: new Date().toISOString(),
    createdBy: state.session.username,
    clientName: String(data.get("clientName")).trim(),
    contact: String(data.get("contact")).trim(),
    model: String(data.get("model")).trim(),
    quantity,
    size: String(data.get("size")).trim(),
    color: String(data.get("color")).trim(),
    supplierId,
    productionCost,
    salePrice,
    notes: String(data.get("notes") || "").trim(),
    productionNote: "",
    status: "em_producao",
  };

  try {
    statePendingAction = {
      type: "create_order",
      payload: {
        clientName: order.clientName,
        contact: order.contact,
        model: order.model,
        quantity: order.quantity,
        size: order.size,
        color: order.color,
        supplierId: order.supplierId,
        productionCost: order.productionCost,
        salePrice: order.salePrice,
        notes: order.notes,
      },
    };
    const message = await persistState();
    renderApp();
    orderFormEl.reset();
    showFlash(message || "Pedido enviado para producao.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao gravar pedido.", "error");
  }
}

async function handleProductionUpdate(event) {
  event.preventDefault();
  const form = event.target.closest(".production-update-form");
  if (!form) {
    return;
  }
  const orderId = form.dataset.orderId;
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) {
    showFlash("Pedido nao encontrado.", "error");
    return;
  }

  const formData = new FormData(form);
  const newStatus = String(formData.get("status"));
  const note = String(formData.get("note") || "").trim();
  if (!STATUS_MAP[newStatus]) {
    showFlash("Status invalido.", "error");
    return;
  }

  try {
    statePendingAction = {
      type: "update_order_status",
      payload: {
        orderId,
        status: newStatus,
        note,
      },
    };
    const message = await persistState();
    renderApp();
    showFlash(message || `Pedido ${order.id} atualizado para ${STATUS_MAP[newStatus].label}.`);
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao atualizar pedido.", "error");
  }
}

async function handleStockCreate(event) {
  event.preventDefault();
  if (!state.suppliers.length) {
    showFlash("Cadastre pelo menos um fornecedor antes de adicionar stock.", "error");
    return;
  }
  const data = new FormData(stockFormEl);
  const quantity = Number(data.get("quantity"));
  const unitCost = Number(data.get("unitCost"));
  const reorderLevel = Number(data.get("reorderLevel"));
  const supplierId = String(data.get("supplierId"));

  if (quantity < 0 || unitCost < 0 || reorderLevel < 0) {
    showFlash("Valores de stock invalidos.", "error");
    return;
  }

  const name = String(data.get("name")).trim();
  const size = String(data.get("size"));
  const color = String(data.get("color"));

  try {
    statePendingAction = {
      type: "create_stock_item",
      payload: {
        name,
        size,
        color,
        supplierId,
        quantity,
        unitCost,
        reorderLevel,
      },
    };
    const message = await persistState();
    renderApp();
    stockFormEl.reset();
    showFlash(message || "Stock atualizado.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao guardar stock.", "error");
  }
}

async function handleStockMove(event) {
  event.preventDefault();
  const form = event.target.closest(".stock-move-form");
  if (!form) {
    return;
  }
  const stockId = form.dataset.stockId;
  const stockItem = state.stockItems.find((item) => item.id === stockId);
  if (!stockItem) {
    showFlash("Item de stock nao encontrado.", "error");
    return;
  }

  const data = new FormData(form);
  const operation = String(data.get("operation"));
  const amount = Number(data.get("amount"));
  if (amount <= 0) {
    showFlash("Quantidade invalida para movimento de stock.", "error");
    return;
  }

  if (operation !== "add" && operation !== "remove") {
    showFlash("Operacao de stock invalida.", "error");
    return;
  }

  try {
    statePendingAction = {
      type: "move_stock",
      payload: {
        stockId,
        operation,
        amount,
      },
    };
    const message = await persistState();
    renderApp();
    showFlash(message || "Movimento de stock registado.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao mover stock.", "error");
  }
}

async function handleStockDelete(event) {
  const button = event.target.closest('button[data-action="delete-stock"]');
  if (!button) {
    return;
  }
  if (state.session?.role !== "admin") {
    showFlash("Apenas Admin pode remover itens de stock.", "error");
    return;
  }
  const stockId = button.dataset.id;
  try {
    statePendingAction = {
      type: "delete_stock",
      payload: {
        stockId,
      },
    };
    const message = await persistState();
    renderApp();
    showFlash(message || "Item de stock removido.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao remover stock.", "error");
  }
}

async function handleSupplierCreate(event) {
  event.preventDefault();
  const data = new FormData(supplierFormEl);
  const name = String(data.get("name")).trim();
  const contact = String(data.get("contact")).trim();
  const city = String(data.get("city")).trim();
  if (!name || !contact || !city) {
    showFlash("Preencha todos os campos do fornecedor.", "error");
    return;
  }
  try {
    statePendingAction = {
      type: "create_supplier",
      payload: {
        name,
        contact,
        city,
      },
    };
    const message = await persistState();
    renderApp();
    supplierFormEl.reset();
    showFlash(message || "Fornecedor adicionado com sucesso.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao adicionar fornecedor.", "error");
  }
}

function addUniqueValue(listName, value) {
  if (!value) {
    return false;
  }
  const exists = state[listName].some((item) => String(item).toLowerCase() === String(value).toLowerCase());
  if (exists) {
    return false;
  }
  state[listName].push(value);
  state[listName].sort();
  return true;
}

async function handleSizeCreate(event) {
  event.preventDefault();
  const data = new FormData(sizeFormEl);
  const size = String(data.get("sizeLabel") || "").trim();
  if (!size) {
    showFlash("Tamanho invalido.", "error");
    return;
  }
  try {
    statePendingAction = {
      type: "create_size",
      payload: {
        label: size,
      },
    };
    const message = await persistState();
    renderApp();
    sizeFormEl.reset();
    showFlash(message || "Tamanho adicionado.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao guardar tamanho.", "error");
  }
}

async function handleColorCreate(event) {
  event.preventDefault();
  const data = new FormData(colorFormEl);
  const color = String(data.get("colorLabel") || "").trim();
  if (!color) {
    showFlash("Cor invalida.", "error");
    return;
  }
  try {
    statePendingAction = {
      type: "create_color",
      payload: {
        label: color,
      },
    };
    const message = await persistState();
    renderApp();
    colorFormEl.reset();
    showFlash(message || "Cor adicionada.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao guardar cor.", "error");
  }
}

async function handleSupplierDelete(event) {
  const button = event.target.closest('button[data-action="delete-supplier"]');
  if (!button) {
    return;
  }
  const supplierId = button.dataset.id;
  const linkedStock = state.stockItems.some((item) => String(item.supplierId) === String(supplierId));
  const linkedOrders = state.orders.some((order) => String(order.supplierId) === String(supplierId));
  if (linkedStock || linkedOrders) {
    showFlash("Fornecedor em uso em stock ou pedidos. Nao pode remover.", "error");
    return;
  }
  try {
    statePendingAction = {
      type: "delete_supplier",
      payload: {
        supplierId,
      },
    };
    const message = await persistState();
    renderApp();
    showFlash(message || "Fornecedor removido.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao remover fornecedor.", "error");
  }
}

async function handleLossCreate(event) {
  event.preventDefault();
  const data = new FormData(lossFormEl);
  const entryType = String(data.get("entryType"));
  const description = String(data.get("description")).trim();
  const amount = Number(data.get("amount"));
  if (!description || amount < 0) {
    showFlash("Perda/despesa invalida.", "error");
    return;
  }
  try {
    statePendingAction = {
      type: "create_loss_entry",
      payload: {
        entryType,
        description,
        amount,
      },
    };
    const message = await persistState();
    renderApp();
    lossFormEl.reset();
    showFlash(message || "Lancamento registado.");
  } catch (error) {
    statePendingAction = null;
    showFlash(error.message || "Falha ao guardar lancamento.", "error");
  }
}

function attachListeners() {
  loginFormEl.addEventListener("submit", (event) => {
    handleLogin(event);
  });
  logoutBtnEl.addEventListener("click", () => {
    handleLogout();
  });
  navEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-view]");
    if (!button) {
      return;
    }
    setActiveView(button.dataset.view);
  });

  orderFormEl.addEventListener("submit", (event) => {
    handleNewOrder(event);
  });
  productionTableBodyEl.addEventListener("submit", (event) => {
    handleProductionUpdate(event);
  });

  stockFormEl.addEventListener("submit", (event) => {
    handleStockCreate(event);
  });
  stockTableBodyEl.addEventListener("submit", (event) => {
    handleStockMove(event);
  });
  stockTableBodyEl.addEventListener("click", (event) => {
    handleStockDelete(event);
  });

  supplierFormEl.addEventListener("submit", (event) => {
    handleSupplierCreate(event);
  });
  sizeFormEl.addEventListener("submit", (event) => {
    handleSizeCreate(event);
  });
  colorFormEl.addEventListener("submit", (event) => {
    handleColorCreate(event);
  });
  supplierTableBodyEl.addEventListener("click", (event) => {
    handleSupplierDelete(event);
  });

  lossFormEl.addEventListener("submit", (event) => {
    handleLossCreate(event);
  });
}

const viewIds = ["dashboard", "pedidos", "producao", "stock", "fornecedores", "perdas", "financeiro"];
let activeView = "dashboard";
let flashTimeoutId = null;
let state = createInitialState();
let statePendingAction = null;

const loginSectionEl = document.getElementById("loginSection");
const appSectionEl = document.getElementById("appSection");
const loginFormEl = document.getElementById("loginForm");
const logoutBtnEl = document.getElementById("logoutBtn");
const sessionInfoEl = document.getElementById("sessionInfo");
const sessionNameEl = document.getElementById("sessionName");
const sessionRoleEl = document.getElementById("sessionRole");
const navEl = document.getElementById("mainNav");
const flashMessageEl = document.getElementById("flashMessage");
const syncStatusEl = document.getElementById("syncStatus");

const dashboardViewEl = document.getElementById("view-dashboard");

const orderFormEl = document.getElementById("orderForm");
const ordersTableBodyEl = document.getElementById("ordersTableBody");
const orderSizeEl = document.getElementById("orderSize");
const orderColorEl = document.getElementById("orderColor");
const orderSupplierEl = document.getElementById("orderSupplier");

const productionTableBodyEl = document.getElementById("productionTableBody");

const stockFormEl = document.getElementById("stockForm");
const stockTableBodyEl = document.getElementById("stockTableBody");
const stockSizeEl = document.getElementById("stockSize");
const stockColorEl = document.getElementById("stockColor");
const stockSupplierEl = document.getElementById("stockSupplier");

const supplierFormEl = document.getElementById("supplierForm");
const sizeFormEl = document.getElementById("sizeForm");
const colorFormEl = document.getElementById("colorForm");
const supplierTableBodyEl = document.getElementById("supplierTableBody");
const sizeListEl = document.getElementById("sizeList");
const colorListEl = document.getElementById("colorList");

const lossFormEl = document.getElementById("lossForm");
const lossTableBodyEl = document.getElementById("lossTableBody");

const financeCardsEl = document.getElementById("financeCards");
const financeDetailEl = document.getElementById("financeDetail");

async function initializeApp() {
  attachListeners();
  syncStatusEl.className = "sync-badge remote";
  syncStatusEl.textContent = "MySQL Hostinger";

  try {
    const authPayload = await apiCall("?route=auth/session", { method: "GET" });
    const session = authPayload.session || null;
    if (session) {
      state.session = session;
      await refreshStateFromApi();
      state.session = session;
    }
  } catch (error) {
    showFlash(error.message || "Falha ao inicializar aplicacao.", "error");
  }

  renderApp();
}

initializeApp();
