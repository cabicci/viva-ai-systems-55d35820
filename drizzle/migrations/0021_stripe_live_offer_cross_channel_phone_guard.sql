ALTER FUNCTION billing.commerce_assert_offer_phone(uuid,text,text,uuid,uuid,uuid) RENAME TO commerce_pre_live_offer_phone;
CREATE FUNCTION billing.commerce_assert_offer_phone(p_offer uuid,p_phone text,p_email text,p_user uuid,p_order uuid DEFAULT NULL,p_invitation uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commerce_pre_live_offer_phone(p_offer,p_phone,p_email,p_user,p_order,p_invitation);
 IF EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations WHERE offer_id=p_offer AND (phone=p_phone OR recipient_email=p_email OR user_id=p_user) AND (consumed_at IS NOT NULL OR expires_at>now())) THEN RAISE EXCEPTION 'COMMERCE_OFFER_ALREADY_USED'; END IF;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_assert_offer_phone(uuid,text,text,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;