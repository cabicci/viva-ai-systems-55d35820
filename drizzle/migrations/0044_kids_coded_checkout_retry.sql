DO $migration$
DECLARE
  target regprocedure := to_regprocedure('public.reserve_stripe_live_offer(uuid,text,text,text,text,text,uuid,boolean)');
  definition text;
  old_guard text := $guard$IF q->>'offer_id' IS NULL THEN RAISE EXCEPTION 'LIVE_OFFER_AUTOMATIC_BETTER'; END IF;$guard$;
  new_guard text := $guard$IF q->>'offer_id' IS NULL THEN
  IF p_package='kids' AND q->>'automatic_discount'='true' THEN
   RETURN jsonb_build_object('use_offer',false,'quote',q);
  END IF;
  RAISE EXCEPTION 'LIVE_OFFER_AUTOMATIC_BETTER';
 END IF;$guard$;
BEGIN
  IF (SELECT encode(sha256(convert_to(replace(prosrc, E'\r\n', E'\n'), 'UTF8')), 'hex')
      FROM pg_proc WHERE oid=target AND prokind='f' AND prosecdef
      AND proconfig=ARRAY['search_path=""']) IS DISTINCT FROM '7a56831ae23b408f58f5d04f7c388b5275c05a96d864ef05968888b81f4ab1bd'
  THEN RAISE EXCEPTION 'KIDS_COUPON_RESERVATION_BASELINE_MISMATCH'; END IF;
  definition := pg_get_functiondef(target);
  IF (length(definition)-length(replace(definition,old_guard,'')))/length(old_guard) <> 1
  THEN RAISE EXCEPTION 'KIDS_COUPON_RESERVATION_GUARD_MISMATCH'; END IF;
  EXECUTE replace(definition,old_guard,new_guard);
  IF (SELECT encode(sha256(convert_to(replace(prosrc, E'\r\n', E'\n'), 'UTF8')), 'hex')
      FROM pg_proc WHERE oid=target) IS DISTINCT FROM '6aa243707352fe254cdc05becebb6cbf2c272bfdae36563107fea2e57d20a3fc'
  THEN RAISE EXCEPTION 'KIDS_COUPON_RESERVATION_POSTCHECK_MISMATCH'; END IF;
END
$migration$;

--> statement-breakpoint
DO $kids_checkout_context$
DECLARE
  target regprocedure := to_regprocedure('public.lc09_previous_get_kids_stripe_checkout_context(uuid,text,text)');
  definition text;
  before_text text := ') INTO v_adult;';
  after_text text := ') OR billing.commerce_external_package(p_user_id) IS NOT NULL INTO v_adult;';
BEGIN
  IF (SELECT encode(sha256(convert_to(replace(prosrc,E'\r\n',E'\n'),'UTF8')),'hex')
      FROM pg_proc WHERE oid=target AND prosecdef AND proconfig=ARRAY['search_path=""'])
    IS DISTINCT FROM 'f039dda00b82956511b9e2e367863ae1d9e9bde1ad2e0d9aede7c298ad960686'
  THEN RAISE EXCEPTION 'KIDS_CHECKOUT_CONTEXT_BASELINE_MISMATCH'; END IF;
  definition := pg_get_functiondef(target);
  IF (length(definition)-length(replace(definition,before_text,'')))/length(before_text) <> 1
  THEN RAISE EXCEPTION 'KIDS_CHECKOUT_CONTEXT_GUARD_MISMATCH'; END IF;
  EXECUTE replace(definition,before_text,after_text);
  IF (SELECT encode(sha256(convert_to(replace(prosrc,E'\r\n',E'\n'),'UTF8')),'hex')
      FROM pg_proc WHERE oid=target)
    IS DISTINCT FROM 'd1e3f45380f56176fc16c38c54a693f1854876c4ad865e7e4f3716334516cca2'
  THEN RAISE EXCEPTION 'KIDS_CHECKOUT_CONTEXT_POSTCHECK_MISMATCH'; END IF;
END
$kids_checkout_context$;
