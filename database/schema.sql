CREATE DATABASE IF NOT EXISTS empresa_gestao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE empresa_gestao;

CREATE TABLE departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL
);

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id BIGINT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(80) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL
);

CREATE TABLE user_module_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  module_id BIGINT UNSIGNED NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 1,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  can_update TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, module_id),
  CONSTRAINT fk_permissions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_permissions_module
    FOREIGN KEY (module_id) REFERENCES modules(id)
    ON DELETE CASCADE
);

CREATE TABLE chat_threads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(190) NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_threads_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  thread_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  message TEXT NOT NULL,
  attachment_path VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_messages_thread
    FOREIGN KEY (thread_id) REFERENCES chat_threads(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_chat_messages_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  tax_number VARCHAR(80) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(60) NULL,
  address TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  tax_number VARCHAR(80) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(60) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES product_categories(id)
    ON DELETE SET NULL
);

CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NULL,
  supplier_id BIGINT UNSIGNED NULL,
  name VARCHAR(190) NOT NULL,
  material_type VARCHAR(120) NULL,
  brand VARCHAR(120) NULL,
  manufacturer VARCHAR(120) NULL,
  color VARCHAR(80) NULL,
  thickness VARCHAR(80) NULL,
  width_m DECIMAL(10,3) NULL,
  length_m DECIMAL(10,3) NULL,
  stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 23.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_products_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL
);

CREATE TABLE quote_presets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  department_id BIGINT UNSIGNED NULL,
  default_margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  CONSTRAINT fk_quote_presets_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL
);

CREATE TABLE sales_quotes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  preset_id BIGINT UNSIGNED NULL,
  status ENUM('draft','sent','approved','rejected','production','invoiced') NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  approval_token VARCHAR(120) NULL UNIQUE,
  approved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_quotes_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_sales_quotes_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_sales_quotes_preset
    FOREIGN KEY (preset_id) REFERENCES quote_presets(id)
    ON DELETE SET NULL
);

CREATE TABLE sales_quote_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 23.00,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_quote_items_quote
    FOREIGN KEY (quote_id) REFERENCES sales_quotes(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_quote_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL
);

CREATE TABLE machines (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  machine_type VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE production_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id BIGINT UNSIGNED NULL,
  customer_id BIGINT UNSIGNED NULL,
  title VARCHAR(190) NOT NULL,
  department VARCHAR(80) NOT NULL DEFAULT 'Publicidade',
  stage ENUM('approval','design','printing','laminating','ready') NOT NULL DEFAULT 'approval',
  work_order_notes TEXT NULL,
  design_file_path VARCHAR(255) NULL,
  planned_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  actual_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  ctt_delivery_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_production_jobs_quote
    FOREIGN KEY (quote_id) REFERENCES sales_quotes(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_production_jobs_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL
);

CREATE TABLE production_routes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  machine_id BIGINT UNSIGNED NULL,
  step_name VARCHAR(120) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  planned_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  actual_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  CONSTRAINT fk_routes_job
    FOREIGN KEY (job_id) REFERENCES production_jobs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_routes_machine
    FOREIGN KEY (machine_id) REFERENCES machines(id)
    ON DELETE SET NULL
);

CREATE TABLE financial_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NULL,
  supplier_id BIGINT UNSIGNED NULL,
  quote_id BIGINT UNSIGNED NULL,
  document_type ENUM('invoice','quote','payable','receivable','purchase_quote') NOT NULL,
  document_number VARCHAR(120) NULL,
  status ENUM('draft','open','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  due_date DATE NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  attachment_path VARCHAR(255) NULL,
  ai_extracted_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_financial_documents_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_financial_documents_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_financial_documents_quote
    FOREIGN KEY (quote_id) REFERENCES sales_quotes(id)
    ON DELETE SET NULL
);

CREATE TABLE cashflow_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT UNSIGNED NULL,
  entry_type ENUM('in','out') NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  entry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cashflow_document
    FOREIGN KEY (document_id) REFERENCES financial_documents(id)
    ON DELETE SET NULL
);

CREATE TABLE customer_credits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_credits_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE
);

INSERT INTO departments (name, description) VALUES
  ('Publicidade', 'Departamento comercial e produtivo de publicidade'),
  ('Estamparia DTF', 'Departamento de estamparia de roupas em DTF'),
  ('Financeiro', 'Controle financeiro, faturas e caixa');

INSERT INTO modules (code, name, description) VALUES
  ('01P', 'Administrador', 'Usuarios, permissoes e chat'),
  ('02P', 'Comercial Publicidade', 'Funil, orcamentos e aprovacao'),
  ('03P', 'Produtos Publicidade', 'Produtos, fornecedores e custos'),
  ('04P', 'Producao Publicidade', 'Kanban, maquinas e apontamentos'),
  ('05P', 'Financeiro', 'Contas, faturas, creditos e caixa');

INSERT INTO suppliers (name, email, phone) VALUES
  ('GrafiStock', 'compras@grafistock.example', '+351 000 000 000'),
  ('DTF Pro', 'fornecedor@dtfpro.example', '+351 000 000 001');

INSERT INTO product_categories (name) VALUES
  ('Impressao grande formato'),
  ('DTF'),
  ('Acabamentos');
