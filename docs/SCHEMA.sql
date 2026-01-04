-- Create profiles table
create table public.profiles (
  id uuid references auth.users (id) on delete cascade not null,
  display_name text null,
  avatar_url text null,
  xp integer not null default 0,
  level integer not null default 1,
  streak_count integer not null default 0,
  last_activity_date date null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policy for profiles
create policy "Users can view and edit their own profiles"
  on public.profiles
  for all
  using (auth.uid() = id);

-- Create user_achievements table
create table public.user_achievements (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null, -- slug like 'night-owl', 'deep-diver'
  unlocked_at timestamp with time zone not null default now(),
  constraint user_achievements_pkey primary key (id),
  constraint user_achievements_unique_user_achievement unique (user_id, achievement_id)
);

-- Enable RLS on user_achievements
alter table public.user_achievements enable row level security;

-- Policy for user_achievements
create policy "Users can view their own achievements"
  on public.user_achievements
  for select
  using (auth.uid() = user_id);

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create tasks table
create table public.tasks (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  description text null,
  deadline timestamp with time zone null,
  completed boolean not null default false,
  xp_awarded boolean not null default false,
  xp_amount integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tasks_pkey primary key (id),
  constraint tasks_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS on tasks
alter table public.tasks enable row level security;

-- Policy for tasks
create policy "Users can view and edit their own tasks"
  on public.tasks
  for all
  using (auth.uid() = user_id);

-- Create xp_transactions table for audit and anti-exploit
create table public.xp_transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  amount integer not null,
  source_type text not null, -- 'task_completion', 'focus_session'
  source_id uuid not null, -- task_id or timer_id
  created_at timestamp with time zone not null default now(),
  constraint xp_transactions_pkey primary key (id),
  constraint xp_transactions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint xp_transactions_unique_source unique (user_id, source_type, source_id)
);

-- Enable RLS on xp_transactions
alter table public.xp_transactions enable row level security;

-- Policy for xp_transactions
create policy "Users can manage their own xp transactions"
  on public.xp_transactions
  for all
  using (auth.uid() = user_id);

-- Create timers table
create table public.timers (
  id uuid not null default gen_random_uuid(),
  task_id uuid not null,
  user_id uuid not null default auth.uid(),
  start_time timestamp with time zone not null default now(),
  end_time timestamp with time zone null,
  duration integer null,
  constraint timers_pkey primary key (id),
  constraint timers_task_id_fkey foreign key (task_id) references public.tasks (id) on delete cascade,
  constraint timers_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS on timers
alter table public.timers enable row level security;

-- Policy for timers
create policy "Users can view and edit their own timers"
  on public.timers
  for all
  using (auth.uid() = user_id);
