import { useLocale } from '@/lib/locale/locale-context';
import { useKidsAiConsent } from '@/lib/kids/use-ai-consent';
import { KidsAiConsentView } from './KidsAiConsentView';

/** Parent settings only; reading this control never grants consent. */
export function KidsAiConsentControl({hideWhenEmpty=false}:{hideWhenEmpty?:boolean}){
 const {locale}=useLocale(),controller=useKidsAiConsent(locale);
 if(hideWhenEmpty&&controller.phase==='ready'&&controller.profiles.length===0)return null;
 return <KidsAiConsentView controller={controller} locale={locale}/>;
}
