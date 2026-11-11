-- Capture a versioned affirmative choice at email signup. Only Auth-managed
-- metadata can carry that choice to the first verification of the same address.
CREATE FUNCTION billing.record_signup_offer_email_consent() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  consent_key constant text := 'masaarat_signup_offer_email';
  consent_version constant text := 'signup-offer-email-v1';
  recipient text := nullif(lower(btrim(NEW.email)),'');
  recipient_hash text := encode(sha256(convert_to(recipient,'UTF8')),'hex');
  evidence jsonb;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.raw_app_meta_data ? consent_key THEN
      NEW.raw_app_meta_data := NEW.raw_app_meta_data-consent_key;
    END IF;
    IF recipient IS NOT NULL AND NOT coalesce(NEW.is_anonymous,false)
       AND NEW.raw_app_meta_data->>'provider'='email'
       AND NEW.raw_user_meta_data->>'offer_email_consent'=consent_version THEN
      NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object(
        consent_key,jsonb_build_object('version',consent_version,'at',statement_timestamp(),'email_hash',recipient_hash));
    END IF;
    IF NEW.raw_user_meta_data ? 'offer_email_consent' THEN
      NEW.raw_user_meta_data := NEW.raw_user_meta_data-'offer_email_consent';
    END IF;
  ELSIF OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  evidence := NEW.raw_app_meta_data->consent_key;
  IF NEW.email_confirmed_at IS NOT NULL AND recipient IS NOT NULL
     AND evidence->>'version'=consent_version AND evidence->>'email_hash'=recipient_hash THEN
    INSERT INTO billing.commerce_mail_preferences AS p(email,campaign_opted_in_at)
    VALUES(recipient,(evidence->>'at')::timestamptz)
    ON CONFLICT(email) DO UPDATE SET campaign_opted_in_at=excluded.campaign_opted_in_at, updated_at=now()
    WHERE p.campaign_opted_in_at IS NULL AND NOT p.marketing_opt_out AND NOT p.suppressed;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.record_signup_offer_email_consent() FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE TRIGGER masaarat_signup_offer_email_consent
BEFORE INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION billing.record_signup_offer_email_consent();
