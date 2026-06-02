UPDATE public.roadmap_items
SET notes = notes || E'\n\n[ai-edit 2026-05-30]: شغّلنا أحمد تاني (v2) على الـ 6 دروس بعد تحسينات الـ concepts.\n\nنتائج Δ Difficulty (Before → After):\n- m3-connect-database: 8 → 9 (+1) ✅ concepts ساعدت بس Service Role Key لسه مرعب\n- m3-webhooks-api: 8 → 9 (+1) ❌ improved=FALSE — لسه مصطلحات تقيلة + mission مش مفهوم\n- m4-agents: 8 → 7 (-1) ✅ تشبيه Tokens=كرت كهرباء نجح\n- m4-rag-in-n8n: 8 → 9 (+1) ✅ concepts نجحت بس Vector DB لسه صعب\n- m5-lead-capture: 8 → 7 (-1) ✅ المخبر/شيت إكسيل نجحت\n- m5-whatsapp-flow: 8 → 8 (=) ✅ تشبيه المخبر/البياع الشاطر نجح\n\nالخلاصة: 5/6 improved=true (الـ concepts شغّالة). لكن difficulty لسه عالي لأن:\n1. الـ missions نفسها تقيلة ومش مبسطة بأمثلة محددة.\n2. webhooks-api لسه مصطلحات إنجليزي كتير من غير glossary.\n3. مفيش screenshots/فيديوهات حقيقية للـ tools.\n\nالأولوية الجديدة (بترتيب):\n1. automator-m3-webhooks-api — الوحيد improved=false، يبدأ بيه التبسيط.\n2. m3-connect-database + m4-rag-in-n8n — اتنين زادوا صعوبة.\n3. باقي الـ 3 لسه محتاجين screenshots + mission simplification.\n\nالمصدر: /mnt/documents/ai-beta-findings-v2.{json,md}',
    updated_at = now()
WHERE id = '6adb6491-3e2d-4eed-a4d0-9ce6bdadcad3';

UPDATE public.roadmap_items
SET notes = notes || E'\n\n[ai-edit 2026-05-30]: شغّلنا أحمد v2 — 5/6 دروس قال improved=true لكن difficulty لسه 7-9.\nأصعب درس: m3-webhooks-api (الوحيد improved=false).\nالقرار المقترح: نبدأ التبسيط بـ webhooks-api كـ pilot قبل ما نوسّع.\nالمصدر: /mnt/documents/ai-beta-findings-v2.md',
    updated_at = now()
WHERE id = '6dc9c05c-36f4-4f44-b570-a24ccdd22c61';
