# كتاب مساراتAI — PDF واحد كامل

## الناتج
ملف واحد: `/mnt/documents/masaarat-ai-book.pdf` يجمع كل دروس المنصة في كتاب عربي RTL مُبرنَد.

## النطاق
- **Intro** + **Builder** + **Creator** + **Automator** + **Analyst** + **Business**
- كل درس = كل بلوكاته (paragraphs / concepts / comparisons / diagrams / screenshots / quizzes / missions)
- روابط فيديو كل درس (URL نصي + QR code صغير جنبه)

## الهيكل
1. **غلاف**: شعار مساراتAI + العنوان + التاريخ
2. **فهرس** تلقائي بأرقام صفحات
3. **مقدمة الكتاب** (paragraph قصير عن المنصة)
4. **قسم لكل مسار** (6 أقسام):
   - صفحة فاصلة بلون المسار + أيقونته
   - كل module = فصل
   - كل lesson = sub-section بترتيب: عنوان → eyebrow → بلوكاته بالترتيب الأصلي → رابط الفيديو + QR
5. **خاتمة + روابط المنصة**

## السستم/الستايل (براند مساراتAI)
- RTL، خط عربي واضح (Cairo أو IBM Plex Sans Arabic — موجود في المنصة)
- ألوان المسارات الموجودة في `src/styles.css` (primary/accent tokens)
- أيقونات المسارات من `public/brand/icons/path-*.svg`
- header/footer: شعار + رقم صفحة + اسم المسار الحالي

## التنفيذ التقني
سكريبت Python واحد (`scripts/generate-book.py`):
1. **استخراج المحتوى**: يقرأ كل ملفات `src/components/intro/lessons/*.ts` + يحلّلها (TS → JSON عبر `bun` يصدّر JSON من كل ملف، أو regex parser للبلوكات).
2. **ترتيب**: حسب الـ curriculum order في `src/lib/unified-lessons.ts` / `curriculum-data.ts`.
3. **توليد PDF**: 
   - `reportlab` مع `arabic-reshaper` + `python-bidi` للنص العربي الصحيح
   - أو `WeasyPrint` (HTML → PDF) لأن HTML أسهل في RTL والستايل المُبرنَد ← **مرجّح**
4. **الصور**: 
   - SVG diagrams من `src/assets/lessons/diagrams/` تتدمج كما هي
   - screenshots: embed من المسار المحلي
5. **QR codes** للفيديوهات: مكتبة `qrcode`
6. **بناء فهرس + ترقيم صفحات** تلقائياً
7. **QA**: تحويل لـ JPG وفحص العينات (غلاف + 5 صفحات عشوائية لكل مسار + فهرس + خاتمة)

## التسليم
- ملف واحد: `/mnt/documents/masaarat-ai-book.pdf`
- `<presentation-artifact>` للتحميل المباشر
- السكريبت يفضل في `scripts/` عشان لو حبيت تعيد التوليد بعد أي تعديل دروس

## ملاحظات
- **مفيش UI تغيير** على المنصة — مجرد artifact يتولّد مرة واحدة
- لو الـ PDF طلع كبير (>50MB) هنضغط الصور أو نقسّمه
- المحتوى نصي + صور موجودة بالفعل — مفيش أي AI generation (صفر استهلاك API credits)
- روادماب: هتتسجل كـ `[source:user]` بعد الموافقة