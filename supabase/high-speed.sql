-- AC Button: version haut débit de la fonction de comptage (1 à 1 000 000 clics par lot).
-- Installer uniquement dans le projet Supabase propriétaire, après examen.
alter table public.acb_sessions drop constraint if exists acb_sessions_clicks_check;
alter table public.acb_sessions add constraint acb_sessions_clicks_check check (clicks >= 0 and clicks <= 1000000000000);
create or replace function public.acb_add_v2(p_id uuid,p_clicks integer)
returns bigint language plpgsql security definer set search_path=''
as $$
declare uid uuid := auth.uid(); t timestamptz := clock_timestamp(); d date := (t at time zone 'UTC')::date;
w date := date_trunc('week',t at time zone 'UTC')::date; n bigint;
begin
 if uid is null or (select u.is_anonymous from auth.users u where u.id=uid) then raise exception 'Compte requis'; end if;
 if p_clicks is null or p_clicks not between 1 and 1000000 then raise exception 'Lot invalide'; end if;
 update public.acb_sessions s set clicks=s.clicks+p_clicks,last_batch_at=t
 where s.id=p_id and s.user_id=uid and s.clicks+p_clicks<=1000000000000
 and (s.last_batch_at is null or s.last_batch_at<=t-interval '750 milliseconds')
 returning s.clicks into n;
 if n is null then raise exception 'Session introuvable, limite atteinte ou fréquence excessive'; end if;
 insert into public.button_players(user_id,pseudo) values(uid,'Cliqueur') on conflict(user_id) do nothing;
 update public.button_players p set
 total=p.total+p_clicks,
 daily=case when p.day_key=d then p.daily+p_clicks else p_clicks end,
 weekly=case when p.week_key=w then p.weekly+p_clicks else p_clicks end,
 day_key=d,week_key=w,last_click=t
 where p.user_id=uid;
 update public.button_world set total=total+p_clicks,updated_at=t where id=1;
 if not found then raise exception 'Compteur mondial introuvable'; end if;
 insert into public.acb_contributions(session_id,day_key,week_key,clicks)
 values(p_id,d,w,p_clicks)
 on conflict(session_id,day_key) do update set clicks=public.acb_contributions.clicks+excluded.clicks;
 return n;
end $$;
revoke all on function public.acb_add_v2(uuid,integer) from public,anon;
grant execute on function public.acb_add_v2(uuid,integer) to authenticated;
