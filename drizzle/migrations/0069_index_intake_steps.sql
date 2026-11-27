-- Read each source step once when validating multilingual intake packages.
DO $migration$
DECLARE
  definition text := pg_get_functiondef('public.curriculum_admin(uuid,text,jsonb)'::regprocedure);
  original text := $old$  FOR item IN SELECT value FROM jsonb_array_elements(p->'lessons') LOOP
   lang:=item->>'locale';
   SELECT s INTO step FROM jsonb_array_elements(package->'stations') station,
    jsonb_array_elements(station->'steps') s WHERE s->>'id'=item->>'lesson';$old$;
  declaration text := 'item jsonb; step jsonb; lang text;';
  updated text := $new$  SELECT jsonb_object_agg(s->>'id',s) INTO steps_by_id
    FROM jsonb_array_elements(package->'stations') station, jsonb_array_elements(station->'steps') s;
   FOR item IN SELECT value FROM jsonb_array_elements(p->'lessons') LOOP
    lang:=item->>'locale';
    step:=steps_by_id->(item->>'lesson');$new$;
BEGIN
  IF strpos(definition,updated)>0 THEN RETURN; END IF;
  IF array_length(string_to_array(definition,original),1)<>2 OR
     array_length(string_to_array(definition,declaration),1)<>2 THEN
    RAISE EXCEPTION 'Unexpected curriculum intake definition';
  END IF;
  EXECUTE replace(replace(definition,declaration,declaration||' steps_by_id jsonb;'),original,updated);
END
$migration$;
