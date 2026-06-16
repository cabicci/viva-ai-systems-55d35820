# Decisions Log

> **Product:** مسارات (masaarat.ai). Table entries may reference Lovable as infrastructure/tooling decisions.

سجل لكل قرار مهم اتاخد على المنصة. الأحدث في الأول. كل قرار له تاريخ + مجال + القرار + السبب + الحالة.

القاعدة: قبل ما أقترح أي تغيير يمس نظام موجود، أبص هنا أشوف فيه قرار قديم متعارض.

| التاريخ | المجال | القرار | السبب | الحالة |
|---------|--------|--------|-------|--------|
| 2026-05-28 | Docs | اعتماد نظام 3 طبقات: platform-map + decisions + plan | تجنب اللخبطة بين الصورة الكبيرة وآخر شغل | مفعّل |
| 2026-05-28 | Missions | Threshold = **60** (مش 70) | المعيار متساهل → تشجيع التجربة مش منع التقدم | مفعّل |
| 2026-05-28 | Missions | **2 محاولات + زرار "وريني نموذج إجابة"** في التالتة | توازن: تعلّم حقيقي + سقف تكلفة + مفيش طالب متحبس | مفعّل |
| 2026-05-28 | Missions | Mission إجبارية: مفيش "الدرس التالي" من غير ما تنجح | الإجبار = الالتزام بالتطبيق | مفعّل |
| 2026-05-28 | Missions | AI evaluation بـ Gemini 2.5 Flash via Lovable AI Gateway | متاح من غير API key + رخيص | مفعّل |
| 2026-05-28 | Missions | Server-side هو source of truth للـ passed flag (تجاهل flag الموديل) | منع تلاعب أو هلوسة من الـ AI | مفعّل |
| 2026-05-28 | Missions | Phase A: 3 reference missions (Builder/Creator/Automator m1) قبل ملء الباقي | اختبار النظام قبل الـ scale | مكتمل |
| 2026-05-XX | Paths | Path integration / visual journey map | — | **مؤجل** |
| 2026-05-XX | Paths | كل المسارات الـ 5 منشورة — ممنوع نقول "coming soon" | — | مفعّل |

## Open Questions (محتاجين قرار)

- Phase B: ملء الـ 92 mission الباقية — ابتدينا ولا لسه؟
- Payments / Subscriptions: مفعّل فعلاً ولا الجدول بس موجود؟
- Mission cost cap على مستوى الـ user (مش بس per-lesson) — محتاج؟