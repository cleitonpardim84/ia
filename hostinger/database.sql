create database if not exists estamparia_lisboa character set utf8mb4 collate utf8mb4_unicode_ci;
use estamparia_lisboa;

create table if not exists app_users (
  id int unsigned not null auto_increment primary key,
  username varchar(60) not null unique,
  full_name varchar(120) not null,
  password_hash char(64) not null,
  role enum('admin', 'atendente', 'producao') not null,
  is_active tinyint(1) not null default 1,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
);

create table if not exists app_counters (
  counter_key varchar(30) not null primary key,
  counter_value int unsigned not null
);

create table if not exists suppliers (
  id int unsigned not null auto_increment primary key,
  supplier_code varchar(30) not null unique,
  name varchar(120) not null,
  contact varchar(120) not null,
  city varchar(80) not null default 'Lisboa',
  created_by int unsigned null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_suppliers_created_by foreign key (created_by) references app_users(id) on delete set null
);

create table if not exists sizes (
  id int unsigned not null auto_increment primary key,
  label varchar(30) not null unique
);

create table if not exists colors (
  id int unsigned not null auto_increment primary key,
  label varchar(30) not null unique
);

create table if not exists stock_items (
  id int unsigned not null auto_increment primary key,
  stock_code varchar(30) not null unique,
  name varchar(120) not null,
  size varchar(30) not null,
  color varchar(30) not null,
  supplier_id int unsigned not null,
  quantity int not null default 0,
  unit_cost decimal(12,2) not null default 0,
  reorder_level int not null default 0,
  created_by int unsigned null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_stock_supplier foreign key (supplier_id) references suppliers(id) on delete restrict,
  constraint fk_stock_created_by foreign key (created_by) references app_users(id) on delete set null
);

create table if not exists orders (
  id int unsigned not null auto_increment primary key,
  order_number varchar(30) not null unique,
  client_name varchar(120) not null,
  contact varchar(80) not null,
  model varchar(120) not null,
  quantity int not null,
  size varchar(30) not null,
  color varchar(30) not null,
  supplier_id int unsigned not null,
  production_cost decimal(12,2) not null,
  sale_price decimal(12,2) not null,
  notes text null,
  production_note text null,
  status enum('em_producao', 'aguardando_pagamento_50', 'pagamento_100') not null default 'em_producao',
  created_by int unsigned not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_orders_supplier foreign key (supplier_id) references suppliers(id) on delete restrict,
  constraint fk_orders_created_by foreign key (created_by) references app_users(id) on delete restrict
);

create table if not exists stock_movements (
  id int unsigned not null auto_increment primary key,
  stock_item_id int unsigned not null,
  movement_type enum('add', 'remove', 'order_deduction') not null,
  amount int not null,
  note varchar(255) null,
  order_id int unsigned null,
  created_by int unsigned null,
  created_at timestamp not null default current_timestamp,
  constraint fk_movement_stock foreign key (stock_item_id) references stock_items(id) on delete cascade,
  constraint fk_movement_order foreign key (order_id) references orders(id) on delete set null,
  constraint fk_movement_user foreign key (created_by) references app_users(id) on delete set null
);

create table if not exists financial_entries (
  id int unsigned not null auto_increment primary key,
  loss_code varchar(30) not null unique,
  entry_type enum('loss', 'expense') not null,
  description varchar(255) not null,
  amount decimal(12,2) not null,
  created_by int unsigned not null,
  created_at timestamp not null default current_timestamp,
  constraint fk_finance_user foreign key (created_by) references app_users(id) on delete restrict
);

insert into app_users (username, full_name, password_hash, role, is_active)
values
  ('admin', 'Admin Geral', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 1),
  ('atendente', 'Atendente', 'e94e143d3a999c2004bed70fdc93ae37470fb3c3c5cd328fa20fbd053e65c4f9', 'atendente', 1),
  ('producao', 'Operador Producao', '247c5a87c4292ac36590492c216e8f565e56b85584892b89fb45dd3a9b6fd2ab', 'producao', 1)
on duplicate key update
  full_name = values(full_name),
  password_hash = values(password_hash),
  role = values(role),
  is_active = 1;

insert into app_counters (counter_key, counter_value)
values
  ('order', 1),
  ('stock', 3),
  ('supplier', 3),
  ('loss', 1)
on duplicate key update
  counter_value = values(counter_value);

insert into suppliers (id, supplier_code, name, contact, city)
values
  (1, 'SUP-1', 'Textil Alfama', '+351 910 000 001', 'Lisboa'),
  (2, 'SUP-2', 'Fios Tejo', '+351 910 000 002', 'Lisboa')
on duplicate key update
  supplier_code = values(supplier_code),
  name = values(name),
  contact = values(contact),
  city = values(city);

insert into sizes (label)
values ('S'), ('M'), ('L'), ('XL')
on duplicate key update label = values(label);

insert into colors (label)
values ('Branco'), ('Preto'), ('Azul Navy')
on duplicate key update label = values(label);

insert into stock_items (
  id, stock_code, name, size, color, supplier_id, quantity, unit_cost, reorder_level
)
values
  (1, 'STK-1', 'T-shirt Basica', 'M', 'Branco', 1, 120, 3.20, 25),
  (2, 'STK-2', 'Hoodie', 'L', 'Preto', 2, 60, 8.50, 15)
on duplicate key update
  stock_code = values(stock_code),
  name = values(name),
  size = values(size),
  color = values(color),
  supplier_id = values(supplier_id),
  quantity = values(quantity),
  unit_cost = values(unit_cost),
  reorder_level = values(reorder_level);
