alter table public.learning_plans
  add column if not exists skill_name text not null default 'Asosiy ko‘nikmalar';

comment on column public.learning_plans.skill_name is
  'Foydalanuvchi aynan o‘rganmoqchi bo‘lgan bitta ko‘nikma';
