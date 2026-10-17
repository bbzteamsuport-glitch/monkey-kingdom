-- MONKEY KINGDOM / SHARED POLL SETUP
-- Запустите один раз в Supabase → SQL Editor → New query.
-- ВАЖНО: Для дружеского опроса без обязательного входа.
-- Одно голосование на один локальный идентификатор браузера,
-- но это НЕ строгая защита от накрутки (очистка браузера позволяет голосовать снова).

create table if not exists public.monkey_votes (
  poll_id text not null,
  voter_id uuid not null,
  game_key text not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, voter_id),
  constraint monkey_votes_game_check check (
    game_key in ('cs2','hoi4','rocket','minecraft','fortnite','valorant','gta',
                 'roblox','phasmophobia','repo','lethal','pubg')
  )
);

-- Никому из анонимных пользователей нельзя напрямую читать идентификаторы голосов.
alter table public.monkey_votes enable row level security;
revoke all on public.monkey_votes from anon, authenticated;

-- Публично отдаём только агрегированные результаты.
create or replace function public.get_monkey_vote_totals(p_poll_id text)
returns table(game_key text, votes bigint)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select v.game_key, count(*)::bigint
  from public.monkey_votes v
  where v.poll_id = p_poll_id
  group by v.game_key
$$;

-- Голосовать можно только за допустимую игру. Повторная запись того же visitor_id не создаётся.
create or replace function public.cast_monkey_vote(
  p_poll_id text, p_voter_id uuid, p_game_key text
)
returns boolean
language plpgsql volatile security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer;
begin
  if p_poll_id is null or p_poll_id !~ '^[a-zA-Z0-9_-]{1,48}$' then
    raise exception 'Invalid poll ID';
  end if;
  if p_voter_id is null then
    raise exception 'Missing visitor ID';
  end if;
  if p_game_key is null or p_game_key not in (
    'cs2','hoi4','rocket','minecraft','fortnite','valorant','gta',
    'roblox','phasmophobia','repo','lethal','pubg'
  ) then
    raise exception 'Invalid game';
  end if;

  insert into public.monkey_votes (poll_id, voter_id, game_key)
  values (p_poll_id, p_voter_id, p_game_key)
  on conflict (poll_id, voter_id) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

revoke all on function public.get_monkey_vote_totals(text) from public;
revoke all on function public.cast_monkey_vote(text,uuid,text) from public;
grant execute on function public.get_monkey_vote_totals(text) to anon, authenticated;
grant execute on function public.cast_monkey_vote(text,uuid,text) to anon, authenticated;

-- Для нового опроса измените pollId в config.js (напр. "season-2").
-- Старые результаты сохраняются под предыдущим poll_id.
