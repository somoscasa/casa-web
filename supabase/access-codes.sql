-- New galleries get 6-character codes (e.g. K7M4QX).
-- Alphabet skips look-alikes (I, O, 0, 1). 32^6 ≈ 1.000 millones de combinaciones.
-- Existing galleries keep their current code.
create or replace function generate_unique_access_token()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  bytes bytea;
  attempt int := 0;
begin
  loop
    bytes := uuid_send(gen_random_uuid());
    new_code := '';
    for i in 0..5 loop
      new_code := new_code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    if not exists (select 1 from galleries where access_token = new_code) then
      return new_code;
    end if;
    attempt := attempt + 1;
    if attempt >= 20 then
      raise exception 'No se pudo generar un código único';
    end if;
  end loop;
end;
$$;
