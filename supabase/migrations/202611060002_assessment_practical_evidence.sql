-- Extend the existing assessment history with practical work and optional external evidence.
alter table public.skill_assessments
  add column if not exists practical_response text,
  add column if not exists practical_passed boolean not null default false,
  add column if not exists evidence_url text,
  add column if not exists evidence_provider text,
  add column if not exists evidence_status text not null default 'unverified'
    check (evidence_status in ('unverified','reviewed','rejected'));
