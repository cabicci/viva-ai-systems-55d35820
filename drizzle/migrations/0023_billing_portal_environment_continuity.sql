CREATE FUNCTION public.get_stripe_portal_environment(p_user_id uuid,p_scope text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e text; n integer;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY'; END IF;
 IF p_scope='core' THEN SELECT count(DISTINCT g.stripe_environment),min(g.stripe_environment) INTO n,e FROM billing.gateway_subscriptions g JOIN billing.subscriptions s ON s.id=g.subscription_id WHERE s.user_id=p_user_id AND g.gateway_code IN ('stripe_us','stripe_us_live') AND g.status IN ('active','trialing','past_due','unpaid','incomplete','paused');
 ELSIF p_scope='kids' THEN SELECT count(DISTINCT stripe_environment),min(stripe_environment) INTO n,e FROM public.kids_stripe_subscriptions WHERE parent_id=p_user_id AND status IN ('active','trialing','past_due','unpaid','incomplete','paused');
 ELSIF p_scope='academic' THEN SELECT count(DISTINCT stripe_environment),min(stripe_environment) INTO n,e FROM billing.academic_stripe_subscriptions WHERE user_id=p_user_id AND status IN ('active','trialing','past_due','unpaid','incomplete','paused');
 ELSIF p_scope='technical' THEN SELECT count(DISTINCT stripe_environment),min(stripe_environment) INTO n,e FROM billing.technical_stripe_subscriptions WHERE user_id=p_user_id AND status IN ('active','trialing','past_due','unpaid','incomplete','paused');
 ELSE RAISE EXCEPTION 'INVALID_SCOPE'; END IF;
 RETURN CASE WHEN n=1 THEN e ELSE 'unavailable' END;
END $$;
REVOKE ALL ON FUNCTION public.get_stripe_portal_environment(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_portal_environment(uuid,text) TO service_role;
COMMENT ON FUNCTION public.get_stripe_portal_environment(uuid,text) IS 'Read-only per-user managed subscription environment. Does not convert Test records, grant access, unlock Test portal or choose between ambiguous environments.';