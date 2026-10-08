CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(p_user_id uuid, p_lease_token uuid, p_next_stage text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ DECLARE r jsonb; BEGIN
 IF p_next_stage IN ('provider_reconciled','learner_erased') AND EXISTS(SELECT 1 FROM public.academic_mail_outbox WHERE user_id=p_user_id AND provider_email_id IS NULL AND NOT blocked AND lease_until>now()) THEN RAISE EXCEPTION 'LC09_ACADEMIC_MAIL_PENDING'; END IF; r:=billing.academic_previous_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN DELETE FROM public.academic_progress WHERE user_id=p_user_id; DELETE FROM public.academic_mail_outbox WHERE user_id=p_user_id; END IF;
 RETURN r;
END $function$
