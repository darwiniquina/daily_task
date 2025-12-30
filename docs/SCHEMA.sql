-- Create tasks table
create table public.tasks (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  description text null,
  deadline timestamp with time zone null,
  completed boolean not null default false,
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
