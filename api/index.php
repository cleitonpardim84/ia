<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name((string) ($config['session_cookie'] ?? 'estamparia_session'));
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function db(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db = (array) ($config['db'] ?? []);
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        (string) ($db['host'] ?? '127.0.0.1'),
        (int) ($db['port'] ?? 3306),
        (string) ($db['name'] ?? 'estamparia_lisboa')
    );
    $pdo = new PDO(
        $dsn,
        (string) ($db['user'] ?? ''),
        (string) ($db['pass'] ?? ''),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    return $pdo;
}

function current_user(): ?array
{
    return isset($_SESSION['user']) && is_array($_SESSION['user']) ? $_SESSION['user'] : null;
}

function require_auth(): array
{
    $user = current_user();
    if ($user === null) {
        json_response(['ok' => false, 'error' => 'Nao autenticado'], 401);
    }
    return $user;
}

function require_role(array $roles): array
{
    $user = require_auth();
    if (!in_array((string) ($user['role'] ?? ''), $roles, true)) {
        json_response(['ok' => false, 'error' => 'Sem permissao'], 403);
    }
    return $user;
}

function next_counter(PDO $pdo, string $key): int
{
    $stmt = $pdo->prepare('SELECT counter_value FROM app_counters WHERE counter_key = :counter_key');
    $stmt->execute(['counter_key' => $key]);
    $row = $stmt->fetch();
    if (!$row) {
        $insert = $pdo->prepare('INSERT INTO app_counters (counter_key, counter_value) VALUES (:counter_key, 2)');
        $insert->execute(['counter_key' => $key]);
        return 1;
    }
    $value = (int) $row['counter_value'];
    $update = $pdo->prepare('UPDATE app_counters SET counter_value = :next_value WHERE counter_key = :counter_key');
    $update->execute(['next_value' => $value + 1, 'counter_key' => $key]);
    return $value;
}

function supplier_id_from_code(PDO $pdo, string $supplierCode): ?int
{
    $stmt = $pdo->prepare('SELECT id FROM suppliers WHERE supplier_code = :supplier_code LIMIT 1');
    $stmt->execute(['supplier_code' => $supplierCode]);
    $id = $stmt->fetchColumn();
    return $id === false ? null : (int) $id;
}

function supplier_code_from_id(PDO $pdo, int $supplierId): string
{
    $stmt = $pdo->prepare('SELECT supplier_code FROM suppliers WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $supplierId]);
    $code = $stmt->fetchColumn();
    return $code === false ? '' : (string) $code;
}

function consume_stock_for_order(PDO $pdo, int $supplierId, string $size, string $color, int $quantity, int $userId, int $orderId): string
{
    $remaining = $quantity;
    $stmt = $pdo->prepare(
        'SELECT id, quantity
         FROM stock_items
         WHERE supplier_id = :supplier_id
           AND size = :size
           AND color = :color
           AND quantity > 0
         ORDER BY id ASC'
    );
    $stmt->execute([
        'supplier_id' => $supplierId,
        'size' => $size,
        'color' => $color,
    ]);
    $items = $stmt->fetchAll();
    if (!$items) {
        return 'Sem stock correspondente para abater automaticamente.';
    }

    $movement = $pdo->prepare(
        'INSERT INTO stock_movements (stock_item_id, movement_type, amount, note, order_id, created_by)
         VALUES (:stock_item_id, :movement_type, :amount, :note, :order_id, :created_by)'
    );

    foreach ($items as $item) {
        if ($remaining <= 0) {
            break;
        }
        $available = (int) $item['quantity'];
        $used = min($available, $remaining);
        $remaining -= $used;

        $update = $pdo->prepare('UPDATE stock_items SET quantity = quantity - :used WHERE id = :id');
        $update->execute(['used' => $used, 'id' => (int) $item['id']]);

        $movement->execute([
            'stock_item_id' => (int) $item['id'],
            'movement_type' => 'order_deduction',
            'amount' => $used,
            'note' => 'Abatimento automatico pelo pedido',
            'order_id' => $orderId,
            'created_by' => $userId,
        ]);
    }

    if ($remaining > 0) {
        return 'Stock parcialmente abatido. Faltam ' . $remaining . ' unidades para este pedido.';
    }
    return 'Stock abatido automaticamente para este pedido.';
}

function fetch_state(PDO $pdo): array
{
    $suppliersRows = $pdo->query('SELECT id, supplier_code, name, contact, city FROM suppliers ORDER BY id ASC')->fetchAll();
    $suppliers = [];
    foreach ($suppliersRows as $row) {
        $suppliers[] = [
            'id' => (string) $row['supplier_code'],
            'name' => (string) $row['name'],
            'contact' => (string) $row['contact'],
            'city' => (string) $row['city'],
        ];
    }

    $sizes = $pdo->query('SELECT label FROM sizes ORDER BY id ASC')->fetchAll(PDO::FETCH_COLUMN);
    $colors = $pdo->query('SELECT label FROM colors ORDER BY id ASC')->fetchAll(PDO::FETCH_COLUMN);

    $stockStmt = $pdo->query(
        'SELECT si.stock_code, si.name, si.size, si.color, s.supplier_code, si.quantity, si.unit_cost, si.reorder_level
         FROM stock_items si
         JOIN suppliers s ON s.id = si.supplier_id
         ORDER BY si.id ASC'
    );
    $stockItems = [];
    foreach ($stockStmt as $row) {
        $stockItems[] = [
            'id' => (string) $row['stock_code'],
            'name' => (string) $row['name'],
            'size' => (string) $row['size'],
            'color' => (string) $row['color'],
            'supplierId' => (string) $row['supplier_code'],
            'quantity' => (int) $row['quantity'],
            'unitCost' => (float) $row['unit_cost'],
            'reorderLevel' => (int) $row['reorder_level'],
        ];
    }

    $orderStmt = $pdo->query(
        'SELECT o.id, o.order_number, o.client_name, o.contact, o.model, o.quantity, o.size, o.color, s.supplier_code,
                o.production_cost, o.sale_price, o.notes, o.production_note, o.status, o.created_at, u.username
         FROM orders o
         JOIN suppliers s ON s.id = o.supplier_id
         JOIN app_users u ON u.id = o.created_by
         ORDER BY o.created_at DESC, o.id DESC'
    );
    $orders = [];
    foreach ($orderStmt as $row) {
        $orders[] = [
            'id' => (string) $row['order_number'],
            'createdAt' => gmdate('c', strtotime((string) $row['created_at'])),
            'createdBy' => (string) $row['username'],
            'clientName' => (string) $row['client_name'],
            'contact' => (string) $row['contact'],
            'model' => (string) $row['model'],
            'quantity' => (int) $row['quantity'],
            'size' => (string) $row['size'],
            'color' => (string) $row['color'],
            'supplierId' => (string) $row['supplier_code'],
            'productionCost' => (float) $row['production_cost'],
            'salePrice' => (float) $row['sale_price'],
            'notes' => (string) ($row['notes'] ?? ''),
            'productionNote' => (string) ($row['production_note'] ?? ''),
            'status' => (string) $row['status'],
        ];
    }

    $lossStmt = $pdo->query(
        'SELECT f.loss_code, f.entry_type, f.description, f.amount, f.created_at, u.username
         FROM financial_entries f
         JOIN app_users u ON u.id = f.created_by
         ORDER BY f.created_at DESC, f.id DESC'
    );
    $lossEntries = [];
    foreach ($lossStmt as $row) {
        $lossEntries[] = [
            'id' => (string) $row['loss_code'],
            'entryType' => (string) $row['entry_type'],
            'description' => (string) $row['description'],
            'amount' => (float) $row['amount'],
            'createdBy' => (string) $row['username'],
            'createdAt' => gmdate('c', strtotime((string) $row['created_at'])),
        ];
    }

    $counterRows = $pdo->query('SELECT counter_key, counter_value FROM app_counters')->fetchAll();
    $counters = ['order' => 1, 'stock' => 1, 'supplier' => 1, 'loss' => 1];
    foreach ($counterRows as $row) {
        $counters[(string) $row['counter_key']] = (int) $row['counter_value'];
    }

    return [
        'session' => current_user(),
        'suppliers' => $suppliers,
        'sizes' => array_values($sizes ?: []),
        'colors' => array_values($colors ?: []),
        'stockItems' => $stockItems,
        'orders' => $orders,
        'lossEntries' => $lossEntries,
        'counters' => $counters,
    ];
}

function handle_auth_login(array $config): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        json_response(['ok' => false, 'error' => 'Metodo nao suportado'], 405);
    }

    $payload = read_json();
    $username = trim((string) ($payload['username'] ?? ''));
    $password = (string) ($payload['password'] ?? '');
    if ($username === '' || $password === '') {
        json_response(['ok' => false, 'error' => 'Utilizador e palavra-passe sao obrigatorios'], 422);
    }

    $pdo = db($config);
    $stmt = $pdo->prepare(
        'SELECT id, username, full_name, role, password_hash, is_active
         FROM app_users
         WHERE username = :username
         LIMIT 1'
    );
    $stmt->execute(['username' => $username]);
    $row = $stmt->fetch();
    if (!$row || (int) $row['is_active'] !== 1) {
        json_response(['ok' => false, 'error' => 'Credenciais invalidas'], 401);
    }

    $hash = hash('sha256', $password);
    if (!hash_equals((string) $row['password_hash'], $hash)) {
        json_response(['ok' => false, 'error' => 'Credenciais invalidas'], 401);
    }

    $_SESSION['user'] = [
        'id' => (int) $row['id'],
        'username' => (string) $row['username'],
        'name' => (string) $row['full_name'],
        'role' => (string) $row['role'],
    ];

    json_response(['ok' => true, 'session' => $_SESSION['user']]);
}

function handle_auth_logout(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        json_response(['ok' => false, 'error' => 'Metodo nao suportado'], 405);
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], '', false, true);
    }
    session_destroy();
    json_response(['ok' => true]);
}

function handle_auth_session(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        json_response(['ok' => false, 'error' => 'Metodo nao suportado'], 405);
    }
    json_response(['ok' => true, 'session' => current_user()]);
}

function handle_state_get(array $config): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        json_response(['ok' => false, 'error' => 'Metodo nao suportado'], 405);
    }
    require_auth();
    $pdo = db($config);
    json_response(['ok' => true, 'data' => fetch_state($pdo)]);
}

function handle_state_put(array $config): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'PUT') {
        json_response(['ok' => false, 'error' => 'Metodo nao suportado'], 405);
    }
    $user = require_role(['admin', 'atendente', 'producao']);
    $payload = read_json();
    $action = trim((string) ($payload['action'] ?? ''));
    $data = is_array($payload['data'] ?? null) ? (array) $payload['data'] : [];
    if ($action === '') {
        json_response(['ok' => false, 'error' => 'Acao obrigatoria'], 422);
    }

    $pdo = db($config);

    try {
        $pdo->beginTransaction();

        if ($action === 'create_order') {
            if (!in_array((string) $user['role'], ['admin', 'atendente'], true)) {
                json_response(['ok' => false, 'error' => 'Sem permissao'], 403);
            }
            $supplierCode = trim((string) ($data['supplierId'] ?? ''));
            $supplierId = supplier_id_from_code($pdo, $supplierCode);
            if ($supplierId === null) {
                json_response(['ok' => false, 'error' => 'Fornecedor invalido'], 422);
            }
            $quantity = (int) ($data['quantity'] ?? 0);
            $productionCost = (float) ($data['productionCost'] ?? -1);
            $salePrice = (float) ($data['salePrice'] ?? -1);
            if ($quantity <= 0 || $productionCost < 0 || $salePrice < 0) {
                json_response(['ok' => false, 'error' => 'Dados invalidos'], 422);
            }

            $orderNum = 'PED-' . next_counter($pdo, 'order');
            $insert = $pdo->prepare(
                'INSERT INTO orders (
                    order_number, client_name, contact, model, quantity, size, color, supplier_id,
                    production_cost, sale_price, notes, production_note, status, created_by
                 ) VALUES (
                    :order_number, :client_name, :contact, :model, :quantity, :size, :color, :supplier_id,
                    :production_cost, :sale_price, :notes, :production_note, :status, :created_by
                 )'
            );
            $insert->execute([
                'order_number' => $orderNum,
                'client_name' => trim((string) ($data['clientName'] ?? '')),
                'contact' => trim((string) ($data['contact'] ?? '')),
                'model' => trim((string) ($data['model'] ?? '')),
                'quantity' => $quantity,
                'size' => trim((string) ($data['size'] ?? '')),
                'color' => trim((string) ($data['color'] ?? '')),
                'supplier_id' => $supplierId,
                'production_cost' => $productionCost,
                'sale_price' => $salePrice,
                'notes' => trim((string) ($data['notes'] ?? '')),
                'production_note' => '',
                'status' => 'em_producao',
                'created_by' => (int) $user['id'],
            ]);
            $orderId = (int) $pdo->lastInsertId();
            $stockMessage = consume_stock_for_order(
                $pdo,
                $supplierId,
                trim((string) ($data['size'] ?? '')),
                trim((string) ($data['color'] ?? '')),
                $quantity,
                (int) $user['id'],
                $orderId
            );

            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Pedido ' . $orderNum . ' enviado para producao. ' . $stockMessage, 'data' => fetch_state($pdo)]);
        }

        if ($action === 'update_order_status') {
            if (!in_array((string) $user['role'], ['admin', 'producao', 'atendente'], true)) {
                json_response(['ok' => false, 'error' => 'Sem permissao'], 403);
            }
            $orderNumber = trim((string) ($data['orderId'] ?? ''));
            $status = trim((string) ($data['status'] ?? ''));
            $note = trim((string) ($data['note'] ?? ''));
            if (!in_array($status, ['em_producao', 'aguardando_pagamento_50', 'pagamento_100'], true)) {
                json_response(['ok' => false, 'error' => 'Status invalido'], 422);
            }
            $update = $pdo->prepare('UPDATE orders SET status = :status, production_note = :production_note WHERE order_number = :order_number');
            $update->execute(['status' => $status, 'production_note' => $note, 'order_number' => $orderNumber]);
            if ($update->rowCount() === 0) {
                json_response(['ok' => false, 'error' => 'Pedido nao encontrado'], 404);
            }
            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Pedido atualizado com sucesso.', 'data' => fetch_state($pdo)]);
        }

        if ($action === 'create_stock_item') {
            if (!in_array((string) $user['role'], ['admin', 'atendente'], true)) {
                json_response(['ok' => false, 'error' => 'Sem permissao'], 403);
            }
            $supplierCode = trim((string) ($data['supplierId'] ?? ''));
            $supplierId = supplier_id_from_code($pdo, $supplierCode);
            if ($supplierId === null) {
                json_response(['ok' => false, 'error' => 'Fornecedor invalido'], 422);
            }
            $name = trim((string) ($data['name'] ?? ''));
            $size = trim((string) ($data['size'] ?? ''));
            $color = trim((string) ($data['color'] ?? ''));
            $quantity = max(0, (int) ($data['quantity'] ?? 0));
            $unitCost = max(0, (float) ($data['unitCost'] ?? 0));
            $reorderLevel = max(0, (int) ($data['reorderLevel'] ?? 0));
            if ($name === '' || $size === '' || $color === '') {
                json_response(['ok' => false, 'error' => 'Dados de stock invalidos'], 422);
            }

            $find = $pdo->prepare(
                'SELECT id
                 FROM stock_items
                 WHERE LOWER(name) = LOWER(:name)
                   AND size = :size
                   AND color = :color
                   AND supplier_id = :supplier_id
                 LIMIT 1'
            );
            $find->execute(['name' => $name, 'size' => $size, 'color' => $color, 'supplier_id' => $supplierId]);
            $existingId = $find->fetchColumn();

            if ($existingId !== false) {
                $update = $pdo->prepare(
                    'UPDATE stock_items
                     SET quantity = quantity + :quantity, unit_cost = :unit_cost, reorder_level = :reorder_level
                     WHERE id = :id'
                );
                $update->execute([
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'reorder_level' => $reorderLevel,
                    'id' => (int) $existingId,
                ]);
                $stockItemId = (int) $existingId;
                $message = 'Stock atualizado para item existente.';
            } else {
                $stockCode = 'STK-' . next_counter($pdo, 'stock');
                $insert = $pdo->prepare(
                    'INSERT INTO stock_items
                     (stock_code, name, size, color, supplier_id, quantity, unit_cost, reorder_level, created_by)
                     VALUES
                     (:stock_code, :name, :size, :color, :supplier_id, :quantity, :unit_cost, :reorder_level, :created_by)'
                );
                $insert->execute([
                    'stock_code' => $stockCode,
                    'name' => $name,
                    'size' => $size,
                    'color' => $color,
                    'supplier_id' => $supplierId,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'reorder_level' => $reorderLevel,
                    'created_by' => (int) $user['id'],
                ]);
                $stockItemId = (int) $pdo->lastInsertId();
                $message = 'Novo item adicionado ao stock.';
            }

            $movement = $pdo->prepare(
                'INSERT INTO stock_movements (stock_item_id, movement_type, amount, note, created_by)
                 VALUES (:stock_item_id, :movement_type, :amount, :note, :created_by)'
            );
            $movement->execute([
                'stock_item_id' => $stockItemId,
                'movement_type' => 'add',
                'amount' => max(1, $quantity),
                'note' => 'Ajuste por formulario de stock',
                'created_by' => (int) $user['id'],
            ]);

            $pdo->commit();
            json_response(['ok' => true, 'message' => $message, 'data' => fetch_state($pdo)]);
        }

        if ($action === 'move_stock') {
            if (!in_array((string) $user['role'], ['admin', 'atendente'], true)) {
                json_response(['ok' => false, 'error' => 'Sem permissao'], 403);
            }
            $stockCode = trim((string) ($data['stockId'] ?? ''));
            $operation = trim((string) ($data['operation'] ?? ''));
            $amount = (int) ($data['amount'] ?? 0);
            if ($amount <= 0 || !in_array($operation, ['add', 'remove'], true)) {
                json_response(['ok' => false, 'error' => 'Movimento de stock invalido'], 422);
            }

            $stockStmt = $pdo->prepare('SELECT id, quantity FROM stock_items WHERE stock_code = :stock_code LIMIT 1');
            $stockStmt->execute(['stock_code' => $stockCode]);
            $stock = $stockStmt->fetch();
            if (!$stock) {
                json_response(['ok' => false, 'error' => 'Item de stock nao encontrado'], 404);
            }

            $stockId = (int) $stock['id'];
            $currentQty = (int) $stock['quantity'];
            if ($operation === 'remove' && $currentQty < $amount) {
                json_response(['ok' => false, 'error' => 'Sem stock suficiente'], 422);
            }

            if ($operation === 'add') {
                $update = $pdo->prepare('UPDATE stock_items SET quantity = quantity + :amount WHERE id = :id');
            } else {
                $update = $pdo->prepare('UPDATE stock_items SET quantity = quantity - :amount WHERE id = :id');
            }
            $update->execute(['amount' => $amount, 'id' => $stockId]);

            $movement = $pdo->prepare(
                'INSERT INTO stock_movements (stock_item_id, movement_type, amount, note, created_by)
                 VALUES (:stock_item_id, :movement_type, :amount, :note, :created_by)'
            );
            $movement->execute([
                'stock_item_id' => $stockId,
                'movement_type' => $operation,
                'amount' => $amount,
                'note' => 'Movimento manual',
                'created_by' => (int) $user['id'],
            ]);

            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Movimento de stock registado.', 'data' => fetch_state($pdo)]);
        }

        if ($action === 'delete_stock') {
            require_role(['admin']);
            $stockCode = trim((string) ($data['stockId'] ?? ''));
            $delete = $pdo->prepare('DELETE FROM stock_items WHERE stock_code = :stock_code');
            $delete->execute(['stock_code' => $stockCode]);
            if ($delete->rowCount() === 0) {
                json_response(['ok' => false, 'error' => 'Item de stock nao encontrado'], 404);
            }
            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Item de stock removido.', 'data' => fetch_state($pdo)]);
        }

        if ($action === 'create_supplier') {
            require_role(['admin']);
            $name = trim((string) ($data['name'] ?? ''));
            $contact = trim((string) ($data['contact'] ?? ''));
            $city = trim((string) ($data['city'] ?? ''));
            if ($name === '' || $contact === '' || $city === '') {
                json_response(['ok' => false, 'error' => 'Dados de fornecedor invalidos'], 422);
            }
            $supplierCode = 'SUP-' . next_counter($pdo, 'supplier');
            $insert = $pdo->prepare(
                'INSERT INTO suppliers (supplier_code, name, contact, city, created_by)
                 VALUES (:supplier_code, :name, :contact, :city, :created_by)'
            );
            $insert->execute([
                'supplier_code' => $supplierCode,
                'name' => $name,
                'contact' => $contact,
                'city' => $city,
                'created_by' => (int) $user['id'],
            ]);
            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Fornecedor adicionado com sucesso.', 'data' => fetch_state($pdo)]);
        }

        if ($action === 'create_size') {
            require_role(['admin']);
            $label = strtoupper(trim((string) ($data['label'] ?? '')));
            if ($label === '') {
                json_response(['ok' => false, 'error' => 'Tamanho invalido'], 422);
            }
            $insert = $pdo->prepare('INSERT INTO sizes (label) VALUES (:label)');
            try {
                $insert->execute(['label' => $label]);
            } catch (Throwable $e) {
                json_response(['ok' => false, 'error' => 'Tamanho ja existe'], 422);
            }
            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Tamanho adicionado.', 'data' => fetch_state($pdo)]);
        }

        if ($action === 'create_color') {
            require_role(['admin']);
            $label = trim((string) ($data['label'] ?? ''));
            if ($label === '') {
                json_response(['ok' => false, 'error' => 'Cor invalida'], 422);
            }
            $insert = $pdo->prepare('INSERT INTO colors (label) VALUES (:label)');
            try {
                $insert->execute(['label' => $label]);
            } catch (Throwable $e) {
                json_response(['ok' => false, 'error' => 'Cor ja existe'], 422);
            }
            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Cor adicionada.', 'data' => fetch_state($pdo)]);
        }

        if ($action === 'delete_supplier') {
            require_role(['admin']);
            $supplierCode = trim((string) ($data['supplierId'] ?? ''));
            $supplierId = supplier_id_from_code($pdo, $supplierCode);
            if ($supplierId === null) {
                json_response(['ok' => false, 'error' => 'Fornecedor nao encontrado'], 404);
            }
            $hasStock = $pdo->prepare('SELECT 1 FROM stock_items WHERE supplier_id = :supplier_id LIMIT 1');
            $hasStock->execute(['supplier_id' => $supplierId]);
            $hasOrders = $pdo->prepare('SELECT 1 FROM orders WHERE supplier_id = :supplier_id LIMIT 1');
            $hasOrders->execute(['supplier_id' => $supplierId]);
            if ($hasStock->fetchColumn() || $hasOrders->fetchColumn()) {
                json_response(['ok' => false, 'error' => 'Fornecedor em uso em stock ou pedidos. Nao pode remover.'], 422);
            }
            $delete = $pdo->prepare('DELETE FROM suppliers WHERE id = :id');
            $delete->execute(['id' => $supplierId]);
            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Fornecedor removido.', 'data' => fetch_state($pdo)]);
        }

        if ($action === 'create_loss_entry') {
            require_role(['admin']);
            $entryType = trim((string) ($data['entryType'] ?? ''));
            if (!in_array($entryType, ['loss', 'expense'], true)) {
                json_response(['ok' => false, 'error' => 'Tipo invalido'], 422);
            }
            $description = trim((string) ($data['description'] ?? ''));
            $amount = (float) ($data['amount'] ?? -1);
            if ($description === '' || $amount < 0) {
                json_response(['ok' => false, 'error' => 'Perda/despesa invalida'], 422);
            }
            $lossCode = 'LSE-' . next_counter($pdo, 'loss');
            $insert = $pdo->prepare(
                'INSERT INTO financial_entries (loss_code, entry_type, description, amount, created_by)
                 VALUES (:loss_code, :entry_type, :description, :amount, :created_by)'
            );
            $insert->execute([
                'loss_code' => $lossCode,
                'entry_type' => $entryType,
                'description' => $description,
                'amount' => $amount,
                'created_by' => (int) $user['id'],
            ]);
            $pdo->commit();
            json_response(['ok' => true, 'message' => 'Lancamento registado.', 'data' => fetch_state($pdo)]);
        }

        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(['ok' => false, 'error' => 'Acao nao suportada'], 422);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(['ok' => false, 'error' => 'Erro interno: ' . $e->getMessage()], 500);
    }
}

$route = trim((string) ($_GET['route'] ?? 'health'));

if ($route === '' || $route === 'health') {
    json_response(['ok' => true, 'service' => 'estamparia-api']);
}

if ($route === 'auth/login') {
    handle_auth_login($config);
}

if ($route === 'auth/logout') {
    handle_auth_logout();
}

if ($route === 'auth/session') {
    handle_auth_session();
}

if ($route === 'state' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    handle_state_get($config);
}

if ($route === 'state' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'PUT') {
    handle_state_put($config);
}

json_response(['ok' => false, 'error' => 'Endpoint nao encontrado'], 404);
