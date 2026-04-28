begin;

-- Seed base catalog used by the frontend.
insert into public.suppliers (id, name, contact, city)
values
  ('11111111-1111-1111-1111-111111111111', 'Textil Alfama', '+351 910 000 001', 'Lisboa'),
  ('22222222-2222-2222-2222-222222222222', 'Fios Tejo', '+351 910 000 002', 'Lisboa')
on conflict (id) do update
set
  name = excluded.name,
  contact = excluded.contact,
  city = excluded.city;

insert into public.sizes (label)
values
  ('S'),
  ('M'),
  ('L'),
  ('XL')
on conflict do nothing;

insert into public.colors (label)
values
  ('Branco'),
  ('Preto'),
  ('Azul Navy')
on conflict do nothing;

insert into public.stock_items (
  id,
  name,
  size_id,
  color_id,
  supplier_id,
  quantity,
  unit_cost,
  reorder_level
)
select
  '33333333-3333-3333-3333-333333333333',
  'T-shirt Basica',
  s.id,
  c.id,
  '11111111-1111-1111-1111-111111111111',
  120,
  3.20,
  25
from public.sizes s
join public.colors c on c.label = 'Branco'
where s.label = 'M'
on conflict (id) do update
set
  name = excluded.name,
  quantity = excluded.quantity,
  unit_cost = excluded.unit_cost,
  reorder_level = excluded.reorder_level;

insert into public.stock_items (
  id,
  name,
  size_id,
  color_id,
  supplier_id,
  quantity,
  unit_cost,
  reorder_level
)
select
  '44444444-4444-4444-4444-444444444444',
  'Hoodie',
  s.id,
  c.id,
  '22222222-2222-2222-2222-222222222222',
  60,
  8.50,
  15
from public.sizes s
join public.colors c on c.label = 'Preto'
where s.label = 'L'
on conflict (id) do update
set
  name = excluded.name,
  quantity = excluded.quantity,
  unit_cost = excluded.unit_cost,
  reorder_level = excluded.reorder_level;

commit;
