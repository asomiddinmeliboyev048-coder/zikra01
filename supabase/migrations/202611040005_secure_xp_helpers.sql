-- Lock down direct execution of internal XP and badge helpers.
-- SECURITY DEFINER triggers/functions remain able to invoke these helpers.
revoke execute on function public.add_xp(uuid, integer) from public, anon, authenticated;
revoke execute on function public.grant_badge(uuid, text) from public, anon, authenticated;
