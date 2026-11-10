-- Extend AI Tutor track constraints to include Uzbek, which is already supported by the UI and Gemini route.
alter table public.ai_tutor_profiles
  drop constraint if exists ai_tutor_profiles_selected_track_check;
alter table public.ai_tutor_profiles
  add constraint ai_tutor_profiles_selected_track_check
  check (selected_track in ('english','russian','uzbek','coding','cyber'));

alter table public.ai_tutor_messages
  drop constraint if exists ai_tutor_messages_track_check;
alter table public.ai_tutor_messages
  add constraint ai_tutor_messages_track_check
  check (track in ('english','russian','uzbek','coding','cyber'));
