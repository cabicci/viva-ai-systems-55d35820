DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.stripe_live_offer_admin(uuid,text,jsonb)'::regprocedure);
 IF position('public.stripe_live_offer_admin_audit a WHERE a.action' in d)=0 OR position('public.stripe_live_offer_reservations r ORDER BY' in d)=0 THEN RAISE EXCEPTION 'ADMIN_LIST_PATTERN_MISSING'; END IF;
 d:=replace(d,'public.stripe_live_offer_admin_audit a WHERE a.action=''release'' AND a.target_id=r.id','public.stripe_live_offer_admin_audit audit_row WHERE audit_row.action=''release'' AND audit_row.target_id=reservation_row.id');
 d:=replace(d,'public.stripe_live_offer_reservations r ORDER BY','public.stripe_live_offer_reservations reservation_row ORDER BY');
 EXECUTE d;
END $$;