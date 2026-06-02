
UPDATE public.roadmap_items
SET status = 'done'::roadmap_status,
    completed_at = now(),
    updated_at = now(),
    notes = $$تم التنفيذ.

البنية التحتية:
- جدول public.rate_limit_buckets (RLS مغلق — service_role فقط)
- function public.consume_rate_limit (atomic check-and-increment، SECURITY DEFINER، GRANT EXECUTE لـ service_role فقط)
- src/lib/rate-limit.server.ts (helper لـ TanStack server functions، يرمي Error عربي عند التجاوز)
- داخل supabase/functions/assistant-runtime: نسخة inline من الـ RPC call (الـ edge function ما تقدرش تستورد من src/)

الحدود المطبقة (لكل user / ساعة):
- evaluateMissionWithAI → 10
- revealModelMissionAnswer → 30
- assistant-runtime → 50

سلوك الفشل:
- لو الـ RPC نفسه فشل (خطأ infra) → fail open مع console.error.
- لو المستخدم تجاوز الحد → رسالة عربية فيها كم دقيقة فاضلة للـ reset.$$
WHERE id = '193d8956-8996-4a51-ad05-8b273f52d11f';
