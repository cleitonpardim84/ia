const STORAGE_KEY = "estamparia_lisboa_v1";
const DEFAULT_STATE_ID = "main";
const SUPABASE_TABLE = "app_state";
const SUPABASE_SCHEMA = "public";

const USERS = [
  { username: "admin", password: "admin123", role: "admin", name: "Admin Geral" },
  { username: "atendente", password: "atendente123", role: "atendente", name: "Atendente" },
  { username: "producao", password: "producao123", role: "producao", name: "Operador Producao" },
];

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
    suppliers: [
      { id: "SUP-1", name: "Textil Alfama", contact: "+351 910 000 001", city: "Lisboa" },
      { id: "SUP-2", name: "Fios Tejo", contact: "+351 910 000 002", city: "Lisboa" },
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Branco", "Preto", "Azul Navy"],
    stockItems: [
      {
        id: "STK-1",
        name: "T-shirt Basica",
        size: "M",
        color: "Branco",
        supplierId: "SUP-1",
        quantity: 120,
        unitCost: 3.2,
        reorderLevel: 25,
      },
      {
        id: "STK-2",
        name: "Hoodie",
        size: "L",
        color: "Preto",
        supplierId: "SUP-2",
        quantity: 60,
        unitCost: 8.5,
        reorderLevel: 15,
      },
    ],
    orders: [],
    lossEntries: [],
    counters: {
      order: 1,
      stock: 3,
      supplier: 3,
      loss: 1,
    },
  };
}

function normalizeState(rawState) {
  const base = createInitialState();
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const normalized = {
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

  if (!normalized.session || !USERS.some((user) => user.username === normalized.session.username)) {
    normalized.session = null;
  }

  return normalized;
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    return createInitialState();
  }
}

function saveLocalState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function supabaseConfig() {
  const config = window.APP_CONFIG || {};
  const url = String(config.SUPABASE_URL || "").trim();
  const anonKey = String(config.SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

function hasSupabaseClient() {
  return Boolean(window.supabase && typeof window.supabase.createClient === "function");
}

function buildSupabaseClient() {
  const config = supabaseConfig();
  if (!config || !hasSupabaseClient()) {
    return null;
  }
  return window.supabase.createClient(config.url, config.anonKey);
}

async function loadRemoteState() {
  if (!supabaseClient) {
    return null;
  }
  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .select("id, payload")
    .eq("id", DEFAULT_STATE_ID)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data || !data.payload) {
    return null;
  }
  return normalizeState(data.payload);
}

async function saveRemoteState(nextState) {
  if (!supabaseClient) {
    return;
  }
  const payload = normalizeState(nextState);
  const { error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .upsert(
      {
        id: DEFAULT_STATE_ID,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) {
    throw error;
  }
}

function updateSyncBadge(mode, message) {
  if (!syncStatusEl) {
    return;
  }
  syncStatusEl.className = `sync-badge ${mode}`;
  syncStatusEl.textContent = message;
}

async function loadState() {
  const localState = loadLocalState();
  if (!supabaseClient) {
    syncMode = "local";
    updateSyncBadge("local", "Modo local");
    return localState;
  }

  try {
    const remoteState = await loadRemoteState();
    if (remoteState) {
      syncMode = "remote";
      updateSyncBadge("remote", "Supabase ligado");
      saveLocalState(remoteState);
      return remoteState;
    }

    await saveRemoteState(localState);
    syncMode = "remote";
    updateSyncBadge("remote", "Supabase ligado");
    return localState;
  } catch (error) {
    console.error("Falha ao carregar do Supabase:", error);
    syncMode = "fallback";
    updateSyncBadge("error", "Erro Supabase - fallback local");
    return localState;
  }
}

function saveState() {
  const snapshot = normalizeState(state);
  saveLocalState(snapshot);
  if (!supabaseClient) {
    syncMode = "local";
    updateSyncBadge("local", "Modo local");
    return;
  }
  saveRemoteState(snapshot)
    .then(() => {
      syncMode = "remote";
      updateSyncBadge("remote", "Supabase ligado");
    })
    .catch((error) => {
      console.error("Falha ao gravar no Supabase:", error);
      syncMode = "fallback";
      updateSyncBadge("error", "Erro Supabase - fallback local");
      showFlash("Gravado localmente. Falha na sincronizacao Supabase.", "error");
    });
}

function getNextId(counterKey, prefix) {
  const currentValue = Number(state.counters[counterKey] || 1);
  state.counters[counterKey] = currentValue + 1;
  return `${prefix}-${currentValue}`;
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
  return state.suppliers.find((supplier) => supplier.id === supplierId);
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

  let alertHtml = "";
  if (lowStockItems.length) {
    alertHtml = `
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
    `;
  } else {
    alertHtml = '<div class="alert ok">Sem alertas de stock minimo neste momento.</div>';
  }

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

function tryConsumeStockForOrder(order) {
  let remaining = Number(order.quantity);
  const candidates = state.stockItems.filter(
    (item) =>
      item.size === order.size && item.color === order.color && item.supplierId === order.supplierId && Number(item.quantity) > 0
  );
  if (!candidates.length) {
    return "Sem stock correspondente para abater automaticamente.";
  }
  for (const item of candidates) {
    if (remaining <= 0) {
      break;
    }
    const available = Number(item.quantity);
    const used = Math.min(available, remaining);
    item.quantity = available - used;
    remaining -= used;
  }
  if (remaining > 0) {
    return `Stock parcialmente abatido. Faltam ${remaining} unidades para este pedido.`;
  }
  return "Stock abatido automaticamente para este pedido.";
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginFormEl);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  const user = USERS.find((entry) => entry.username === username && entry.password === password);
  if (!user) {
    showFlash("Credenciais invalidas. Tente novamente.", "error");
    return;
  }

  state.session = { username: user.username, role: user.role, name: user.name };
  saveState();
  renderApp();
  showFlash(`Sessao iniciada como ${user.name}.`);
}

function handleLogout() {
  state.session = null;
  saveState();
  renderApp();
}

function handleNewOrder(event) {
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
    id: getNextId("order", "PED"),
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

  state.orders.push(order);
  const stockResultMessage = tryConsumeStockForOrder(order);
  saveState();
  renderApp();
  orderFormEl.reset();
  showFlash(`Pedido ${order.id} enviado para producao. ${stockResultMessage}`);
}

function handleProductionUpdate(event) {
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

  order.status = newStatus;
  order.productionNote = note;
  saveState();
  renderApp();
  showFlash(`Pedido ${order.id} atualizado para ${STATUS_MAP[newStatus].label}.`);
}

function handleStockCreate(event) {
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

  const existing = state.stockItems.find(
    (item) =>
      item.name.toLowerCase() === String(data.get("name")).trim().toLowerCase() &&
      item.size === String(data.get("size")) &&
      item.color === String(data.get("color")) &&
      item.supplierId === supplierId
  );

  if (existing) {
    existing.quantity = Number(existing.quantity) + quantity;
    existing.reorderLevel = reorderLevel;
    existing.unitCost = unitCost;
    showFlash("Stock atualizado para item existente.");
  } else {
    state.stockItems.push({
      id: getNextId("stock", "STK"),
      name: String(data.get("name")).trim(),
      size: String(data.get("size")).trim(),
      color: String(data.get("color")).trim(),
      supplierId,
      quantity,
      unitCost,
      reorderLevel,
    });
    showFlash("Novo item adicionado ao stock.");
  }

  saveState();
  renderApp();
  stockFormEl.reset();
}

function handleStockMove(event) {
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

  if (operation === "add") {
    stockItem.quantity = Number(stockItem.quantity) + amount;
  } else if (operation === "remove") {
    if (Number(stockItem.quantity) < amount) {
      showFlash(`Sem stock suficiente em ${stockItem.name}.`, "error");
      return;
    }
    stockItem.quantity = Number(stockItem.quantity) - amount;
  } else {
    showFlash("Operacao de stock invalida.", "error");
    return;
  }

  saveState();
  renderApp();
  showFlash("Movimento de stock registado.");
}

function handleStockDelete(event) {
  const button = event.target.closest('button[data-action="delete-stock"]');
  if (!button) {
    return;
  }
  if (state.session?.role !== "admin") {
    showFlash("Apenas Admin pode remover itens de stock.", "error");
    return;
  }
  const stockId = button.dataset.id;
  state.stockItems = state.stockItems.filter((item) => item.id !== stockId);
  saveState();
  renderApp();
  showFlash("Item de stock removido.");
}

function handleSupplierCreate(event) {
  event.preventDefault();
  const data = new FormData(supplierFormEl);
  const name = String(data.get("name")).trim();
  const contact = String(data.get("contact")).trim();
  const city = String(data.get("city")).trim();
  if (!name || !contact || !city) {
    showFlash("Preencha todos os campos do fornecedor.", "error");
    return;
  }
  state.suppliers.push({
    id: getNextId("supplier", "SUP"),
    name,
    contact,
    city,
  });
  saveState();
  renderApp();
  supplierFormEl.reset();
  showFlash("Fornecedor adicionado com sucesso.");
}

function addUniqueValue(listName, value) {
  if (!value) {
    return false;
  }
  const exists = state[listName].some((item) => item.toLowerCase() === value.toLowerCase());
  if (exists) {
    return false;
  }
  state[listName].push(value);
  state[listName].sort();
  return true;
}

function handleSizeCreate(event) {
  event.preventDefault();
  const data = new FormData(sizeFormEl);
  const size = String(data.get("sizeLabel") || "").trim();
  if (!size) {
    showFlash("Tamanho invalido.", "error");
    return;
  }
  if (!addUniqueValue("sizes", size)) {
    showFlash("Tamanho ja existe.", "error");
    return;
  }
  saveState();
  renderApp();
  sizeFormEl.reset();
  showFlash("Tamanho adicionado.");
}

function handleColorCreate(event) {
  event.preventDefault();
  const data = new FormData(colorFormEl);
  const color = String(data.get("colorLabel") || "").trim();
  if (!color) {
    showFlash("Cor invalida.", "error");
    return;
  }
  if (!addUniqueValue("colors", color)) {
    showFlash("Cor ja existe.", "error");
    return;
  }
  saveState();
  renderApp();
  colorFormEl.reset();
  showFlash("Cor adicionada.");
}

function handleSupplierDelete(event) {
  const button = event.target.closest('button[data-action="delete-supplier"]');
  if (!button) {
    return;
  }
  const supplierId = button.dataset.id;
  const linkedStock = state.stockItems.some((item) => item.supplierId === supplierId);
  const linkedOrders = state.orders.some((order) => order.supplierId === supplierId);
  if (linkedStock || linkedOrders) {
    showFlash("Fornecedor em uso em stock ou pedidos. Nao pode remover.", "error");
    return;
  }
  state.suppliers = state.suppliers.filter((supplier) => supplier.id !== supplierId);
  saveState();
  renderApp();
  showFlash("Fornecedor removido.");
}

function handleLossCreate(event) {
  event.preventDefault();
  const data = new FormData(lossFormEl);
  const entryType = String(data.get("entryType"));
  const description = String(data.get("description")).trim();
  const amount = Number(data.get("amount"));
  if (!description || amount < 0) {
    showFlash("Perda/despesa invalida.", "error");
    return;
  }
  state.lossEntries.push({
    id: getNextId("loss", "LSE"),
    entryType,
    description,
    amount,
    createdAt: new Date().toISOString(),
    createdBy: state.session?.username || "sistema",
  });
  saveState();
  renderApp();
  lossFormEl.reset();
  showFlash("Lancamento registado.");
}

function attachListeners() {
  loginFormEl.addEventListener("submit", handleLogin);
  logoutBtnEl.addEventListener("click", handleLogout);
  navEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-view]");
    if (!button) {
      return;
    }
    setActiveView(button.dataset.view);
  });

  orderFormEl.addEventListener("submit", handleNewOrder);
  productionTableBodyEl.addEventListener("submit", handleProductionUpdate);

  stockFormEl.addEventListener("submit", handleStockCreate);
  stockTableBodyEl.addEventListener("submit", handleStockMove);
  stockTableBodyEl.addEventListener("click", handleStockDelete);

  supplierFormEl.addEventListener("submit", handleSupplierCreate);
  sizeFormEl.addEventListener("submit", handleSizeCreate);
  colorFormEl.addEventListener("submit", handleColorCreate);
  supplierTableBodyEl.addEventListener("click", handleSupplierDelete);

  lossFormEl.addEventListener("submit", handleLossCreate);
}

const viewIds = ["dashboard", "pedidos", "producao", "stock", "fornecedores", "perdas", "financeiro"];
let activeView = "dashboard";
let flashTimeoutId = null;
let syncMode = "local";
let supabaseClient = null;
let state = createInitialState();

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
  supabaseClient = buildSupabaseClient();
  state = await loadState();
  renderApp();
}

attachListeners();
initializeApp();
