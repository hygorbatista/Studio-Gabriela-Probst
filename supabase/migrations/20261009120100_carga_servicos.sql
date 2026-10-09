-- Os 7 serviços atuais (SV-02), com os valores da landing page em 2026-10-09.

insert into public.services (name, category, price, duration_minutes, duration_up_to, sort_order) values
  ('Aplicação de fibra de vidro', 'Fibra e gel', 180, 180, false, 1),
  ('Manutenção de fibra',         'Fibra e gel', 100, 150, false, 2),
  ('Blindagem',                   'Fibra e gel',  80,  90, false, 3),
  ('Esmaltação em gel',           'Fibra e gel',  85,  90, false, 4),
  ('Banho de gel',                'Fibra e gel',  90, 120, true,  5),
  ('Manicure',                    'Tradicional',  30,  60, false, 6),
  ('Pedicure',                    'Tradicional',  35,  60, true,  7);
