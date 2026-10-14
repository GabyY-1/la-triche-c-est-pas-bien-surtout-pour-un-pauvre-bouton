create table if not exists public.acb_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 clicks bigint not null default 0 check (clicks between 0 and 1000000),
 created_at timestamptz not null default now(),
 last_batch_at timestamptz
);
alter table public.acb_sessions enable row level security;
create policy "acb_read_own" on public.acb_sessions for select to authenticated using ((select auth.uid())=user_id);
create policy "acb_create_own" on public.acb_sessions for insert to authenticated with check ((select auth.uid())=user_id and clicks=0);
create policy "acb_delete_own" on public.acb_sessions for delete to authenticated using ((select auth.uid())=user_id);
revoke all on public.acb_sessions from anon;
grant select, insert, delete on public.acb_sessions to authenticated;
revoke update on public.acb_sessions from authenticated;
create or replace function public.acb_add(p_id uuid, p_clicks int) returns bigint
language plpgsql security definer set search_path=''
as $$
declare n bigint;
begin
 if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
 if p_clicks is null or p_clicks not between 1 and 100 then raise exception 'Lot invalide'; end if;
 update public.acb_sessions
 set clicks=clicks+p_clicks,last_batch_at=clock_timestamp()
 where id=p_id and user_id=(select auth.uid()) and clicks+p_clicks<=1000000
 and (last_batch_at is null or last_batch_at<=clock_timestamp()-interval '750 milliseconds')
 returning clicks into n;
 if n is null then raise exception 'Session inaccessible ou fréquence excessive'; end if;
 return n;
end $$;
create or replace function public.acb_global() returns bigint language plpgsql security definer set search_path=''
as $$
begin
 if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
 return (select coalesce(sum(clicks),0)::bigint from public.acb_sessions);
end $$;
revoke all on function public.acb_add(uuid,int) from public,anon;
revoke all on function public.acb_global() from public,anon;
grant execute on function public.acb_add(uuid,int) to authenticated;
grant execute on function public.acb_global() to authenticated;
