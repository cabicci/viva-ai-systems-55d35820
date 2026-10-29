-- Refund RPC has no user argument: resolve its existing invoice owner before
-- acquiring billing row locks, then join the common Live lock order.
DO $$ DECLARE d text; needle text; replacement text; BEGIN
 SELECT pg_get_functiondef('public.apply_stripe_refund_event(text,text,timestamptz,text,text,text,bigint,text,text,text,uuid,boolean)'::regprocedure) INTO d;
 needle:=E'  SELECT * INTO v_sub FROM billing.subscriptions WHERE id=v_pt.subscription_id FOR UPDATE;';
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'LIVE_REFUND_LOCK_PATTERN_MISSING'; END IF;
 replacement:=E'  IF billing.current_stripe_environment()=''live'' THEN\n    PERFORM pg_advisory_xact_lock(hashtextextended(v_pt.user_id::text,751603));\n    PERFORM pg_advisory_xact_lock(hashtextextended(''account-lifecycle:''||v_pt.user_id::text,0));\n    PERFORM pg_advisory_xact_lock(hashtextextended(''live-risk-user:''||v_pt.user_id::text,0));\n  END IF;\n'||needle;
 EXECUTE replace(d,needle,replacement);
END $$;