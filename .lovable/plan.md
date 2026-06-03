
# Phase D — v14 Worst-20 Validation Sim

## الهدف
نتأكد إن تغييرات Phase A+B+C (three-tier + warning rewrite) فعلاً حلّت مشكلة Builder/Automator التقني.

## التنفيذ
- ننسخ `scripts/persona-sim/run_v13_worst20.py` لـ `run_v14_worst20.py`.
- نفس الـ 20 personas (10 archetypes × 2 worst flags).
- نفس النموذج: **gemini-2.5-flash** فقط (gemini-only policy).
- التغييرات في الـ prompt:
  - نشرح للـ persona الـ three-tier system في الـ system prompt.
  - الدروس التقنية تتعرض بصياغتها الجديدة (`اختياري — للمتقدمين` + الجملة الجديدة).
  - نضيف سؤال صريح: `felt_like_engineer` (هل حسّيت إنك بتتعلم شغل مبرمج؟) للتأكد إن الـ pattern ده اختفى.
  - نضيف `tier_clarity` (هل المستويات الثلاثة كانت واضحة؟).

## Pass criteria
1. **Avg completion ≥ 85%** (من 78.1% في v13).
2. **Level 1 paths (intro/business/creator/analyst) avg conf ≥ 8.0**.
3. **Builder skip rate ≥ 70%** (الناس تعدّيه بدل ما تتعب فيه).
4. **`felt_like_engineer = false` في ≥ 16/20** (اختفاء أهم pain pattern).
5. **0 quits** قبل ما يخلصوا Level 1.

## التكلفة (API credits)
- 20 personas × ~1 call each = 20 Gemini calls.
- نفس حجم v13 تقريبًا (دقايق قليلة، تكلفة محدودة).

## المخرجات
- `/mnt/documents/persona-sim-v14-worst20-{ts}.md` (report).
- `/mnt/documents/persona-sim-v14-worst20-{ts}-raw.json`.
- مقارنة جنب لجنب: v12 vs v13 vs v14.
- روداماب item جديد + sync marker.

## Phase E (re-render) لسه موقوف
هنبص في النتيجة الأول قبل أي قرار بخصوص فك التجميد.
