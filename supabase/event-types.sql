-- Allow every kind of event CASA covers (bodas, quinces, cumpleaños, eventos sociales).
alter table public.events drop constraint if exists events_type_check;
alter table public.events
  add constraint events_type_check
  check (type is null or type in ('boda', 'quince', 'cumpleanos', 'evento'));
