import type { SupportedLocale } from "@/lib/locale/types";

type Text = readonly [string, string, string, string];
const locales: SupportedLocale[] = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
function text(value: Text, locale: SupportedLocale) {
  return value[locales.indexOf(locale)];
}
function common(ar: string, en: string): Text {
  return [ar, ar, ar, en];
}

export function getPilotCopy(locale: SupportedLocale) {
  const t = (value: Text) => text(value, locale);
  return {
    title: t([
      "من الرسم لقائمة القطع: وحدة تخزين صغيرة",
      "من الرسم إلى قائمة القطع: وحدة تخزين صغيرة",
      "من المخطط إلى قائمة القص: وحدة تخزين صغيرة",
      "From drawing to cut list: a small storage cabinet",
    ]),
    eyebrow: t(
      common(
        "المهارات الفنية · الأثاث · M1 · الدرس 1",
        "Technical skills · Furniture · M1 · Lesson 1",
      ),
    ),
    intro: t([
      "قبل ما نبدأ التصنيع، لازم كل قطعة تكون واضحة في الرسم وفي قائمة القطع. هنتدرّب على نموذج واحد، ونحسب المقاسات بنفسنا، وبعدها نراجع القائمة.",
      "قبل بدء التصنيع، يجب أن تتطابق أجزاء المنتج في الرسم وقائمة القطع. سنحل نموذجًا محددًا ونراجع حساباته، ثم نطبق الطريقة على أبعاد جديدة.",
      "قبل نبدأ التصنيع، نحتاج مخطط واضح وقائمة قص متطابقة معه. بنتدرّب على نموذج محدد، ونحسب أبعاده، ثم نراجع القائمة قبل تسليمها للورشة.",
      "Before fabrication, each part must agree with the drawing and cut list. Work through one defined cabinet, check the arithmetic, then apply the same construction to new dimensions.",
    ]),
    draft: t(common("تجربة تعليمية على فرع مؤقت", "Temporary-branch teaching pilot")),
    scope: t(
      common(
        "هذا الدرس لتخطيط التصنيع. الأبعاد نموذج مؤلف للتجربة، وليست مقاسات معيارية أو تصريحًا لتشغيل ماكينة.",
        "This lesson teaches fabrication planning. These dimensions are an original teaching example, not a universal standard or permission to operate machinery.",
      ),
    ),
    goalsTitle: t(common("في نهاية الدرس تستطيع", "After this lesson you can")),
    goals: [
      t(
        common(
          "التمييز بين الأبعاد الخارجية وأبعاد الأجزاء.",
          "Distinguish outside dimensions from individual panel dimensions.",
        ),
      ),
      t(
        common(
          "حساب الأجزاء الواقعة بين الجانبين مع مراعاة السمك.",
          "Calculate panels fitted between the sides, allowing for panel thickness.",
        ),
      ),
      t(
        common(
          "احتساب عمق الهيكل عندما يدخل الظهر ضمن العمق النهائي.",
          "Calculate body depth when an overlay back is included in the overall depth.",
        ),
      ),
      t(
        common(
          "إعداد قائمة قطع مرقمة ومراجعة الكمية والوحدات والافتراضات.",
          "Prepare a numbered cut list and check quantities, units and assumptions.",
        ),
      ),
    ],
    prerequisites: t(
      common(
        "المتطلبات: جمع وطرح بسيطان، وقراءة الأبعاد بالمليمتر. الأدوات: ورقة وقلم وحاسبة أو الحاسبة الموجودة في الدرس.",
        "Prerequisites: simple arithmetic and dimensions in millimetres. Tools: paper, pencil and a calculator, or the lesson calculator.",
      ),
    ),
    sections: [
      {
        id: "brief",
        title: t(common("افهم النموذج أولًا", "Read the brief first")),
        body: t(
          common(
            "وحدة مفتوحة من الأمام، بجانبين كاملَي الارتفاع. السقف والقاع والرف الأوسط تقع بين الجانبين. الظهر قطعة تغطي الوجه الخلفي من الخارج. العمق النهائي يشمل الظهر. جميع الأبعاد بالمليمتر.",
            "An open-front cabinet with two full-height sides. The top, bottom and middle shelf fit between the sides. A separate back overlays the rear face. Overall depth includes the back. All dimensions are in millimetres.",
          ),
        ),
        note: t(
          common(
            "افتراضات الدرس: سمك اسمي، وصلات تلامسية مباشرة، دون مجاري أو أبواب أو أرجل أو سماحات تشطيب. تغيير أي افتراض يقتضي تحديث الرسم والقائمة.",
            "Lesson assumptions: nominal thickness, butt-joint geometry, no grooves, doors, feet or finishing allowances. Any changed assumption requires a revised drawing and cut list.",
          ),
        ),
      },
      {
        id: "width",
        title: t(common("احسب العرض الداخلي", "Calculate the internal width")),
        body: t(
          common(
            "العرض الخارجي 600. يشغل كل جانب 18 من العرض. لذلك طول السقف والقاع والرف هو 600 − 18 − 18 = 564. هذه المعادلة صالحة لأن الأجزاء تقع بين الجانبين في هذا النموذج.",
            "Outside width is 600. Each side occupies 18 of that width. The top, bottom and shelf lengths are therefore 600 − 18 − 18 = 564. This equation applies because those panels sit between the sides in this construction.",
          ),
        ),
        note: "W − 2t = 600 − 2 × 18 = 564 mm",
      },
      {
        id: "depth",
        title: t(common("افصل عمق الهيكل عن الظهر", "Separate body depth from back thickness")),
        body: t(
          common(
            "العمق النهائي 300 ويشمل ظهرًا خارجيًا سمكه 6. عمق أجزاء الهيكل = 300 − 6 = 294. يبقى الظهر كامل العرض والارتفاع: 600 × 600. لو كان الظهر داخل مجرى لتغيرت طريقة الحساب.",
            "Overall depth is 300, including a 6-thick overlay back. Body panels are 300 − 6 = 294 deep. The back retains the full outside width and height: 600 × 600. A rebated or grooved back would require different geometry.",
          ),
        ),
        note: "D − b = 300 − 6 = 294 mm",
      },
      {
        id: "openings",
        title: t(common("تحقق من الرف والفتحات", "Check shelf and opening heights")),
        body: t(
          common(
            "السقف والقاع والرف تستهلك ثلاثة أسماك: 3 × 18 = 54. الارتفاع الصافي المتبقي = 600 − 54 = 546. لتكوين فتحتين متساويتين يكون ارتفاع كل فتحة 546 ÷ 2 = 273. هذا ارتفاع الفراغ، وليس طول الرف.",
            "The top, bottom and shelf occupy three thicknesses: 3 × 18 = 54. Remaining clear height is 600 − 54 = 546. Two equal openings are 546 ÷ 2 = 273 high each. This is the clear opening height, not the shelf length.",
          ),
        ),
        note: "(H − 3t) ÷ 2 = 273 mm",
      },
      {
        id: "list",
        title: t(common("حوّل الرسم إلى قائمة قطع", "Turn the drawing into a cut list")),
        body: t(
          common(
            "اكتب رقم الجزء والكمية والطول والعرض والسمك. اجمع الأجزاء المتطابقة في صف واحد مع الاحتفاظ بأرقامها. احتفظ بالسمك المختلف للظهر في صف مستقل. العدد الكلي ست قطع: خمسة أجزاء للهيكل وظهر واحد.",
            "Record part IDs, quantity, length, width and thickness. Group identical parts in a single row while retaining their IDs. Keep the thinner back as its own item. There are six pieces: five body panels and one back.",
          ),
        ),
        note: t(
          common(
            "مساحة الأجزاء الصافية لا تحدد وحدها عدد الألواح؛ يلزم توزيع قص يتضمن اتجاه الخامة وعرض القطع بالمنشار والسماحات.",
            "Net panel area alone does not determine stock-board quantity. A cutting layout must also account for material direction, saw kerf and allowances.",
          ),
        ),
      },
      {
        id: "review",
        title: t(common("راجع قبل تسليم القائمة", "Review before releasing the list")),
        body: t(
          common(
            "طابق كل رقم في القائمة مع الرسم. راجع الوحدة والكمية والسمك وطريقة الظهر. قبل التنفيذ الفعلي، يعتمد مختص سماحات القص والتشطيب واتجاه الخامة والوصلات والتثبيت والحمل المتوقع. نطاق هذا الدرس ينتهي عند إعداد ومراجعة قائمة التخطيط.",
            "Match every part ID to the drawing. Check units, quantities, thickness and back construction. Before fabrication, a competent specialist must approve cutting and finishing allowances, material direction, joints, fixing and intended loading. This lesson ends at preparing and checking the planning list.",
          ),
        ),
        note: t(
          common(
            "مشاهدة الفيديو أو اجتياز الاختبار لا تثبت الكفاءة في تشغيل ماكينات النجارة؛ التدريب العملي والإشراف والتقييم منفصلة.",
            "Watching a video or passing the quiz does not establish competence to operate woodworking machinery; practical instruction, supervision and assessment are separate.",
          ),
        ),
      },
    ],
    labels: {
      reading: t(common("الشرح", "Explanation")),
      drawings: t(common("الرسومات", "Drawings")),
      video: t(common("الفيديو", "Video")),
      calculator: t(common("حاسبة الأجزاء", "Panel calculator")),
      quiz: t(common("اختبار الفهم", "Knowledge check")),
      assignment: t(common("التطبيق والتقييم", "Practice & assessment")),
      downloads: t(common("ملفات الدرس", "Lesson files")),
      assistant: t(common("مرشد الدرس", "Lesson guide")),
      width: t(common("العرض الخارجي", "Outside width")),
      height: t(common("الارتفاع الخارجي", "Outside height")),
      depth: t(common("العمق النهائي", "Overall depth")),
      thickness: t(common("سمك الهيكل", "Body thickness")),
      backThickness: t(common("سمك الظهر", "Back thickness")),
      part: t(common("الجزء", "Part")),
      ids: t(common("الأرقام", "IDs")),
      quantity: t(common("الكمية", "Qty")),
      length: t(common("الطول", "Length")),
      panelWidth: t(common("العرض", "Width")),
      sides: t(common("الجانبان", "Sides")),
      horizontal: t(common("السقف والقاع", "Top & bottom")),
      shelf: t(common("الرف الأوسط", "Middle shelf")),
      back: t(common("الظهر الخارجي", "Overlay back")),
      mm: t(common("مم", "mm")),
      reset: t(common("استعادة النموذج", "Reset example")),
      calculate: t(common("احسب الأجزاء", "Calculate panels")),
      invalid: t(
        common(
          "أدخل أبعادًا موجبة: العرض أكبر من ضعف السمك، والارتفاع أكبر من ثلاثة أسماك، والعمق أكبر من سمك الظهر.",
          "Enter positive dimensions: width must exceed two body thicknesses, height three body thicknesses, and depth the back thickness.",
        ),
      ),
      innerWidth: t(common("العرض الداخلي", "Internal width")),
      bodyDepth: t(common("عمق الهيكل", "Body depth")),
      opening: t(common("ارتفاع الفتحة الصافي", "Clear opening height")),
      markRead: t(common("أنهيت قراءة الشرح", "Mark explanation read")),
      readDone: t(common("الشرح مقروء", "Explanation read")),
      check: t(common("راجع الإجابات", "Check answers")),
      retry: t(common("حاول مرة أخرى", "Try again")),
      correct: t(common("صحيح", "Correct")),
      revise: t(common("راجع الحساب", "Review calculation")),
      quizMissing: t(common("أجب عن جميع الأسئلة أولًا.", "Answer all questions first.")),
      quizPassed: t(common("اجتزت اختبار الفهم.", "Knowledge check passed.")),
      quizReview: t(
        common("راجع التفسيرات ثم أعد المحاولة.", "Read the explanations, then try again."),
      ),
      progress: t(common("التقدم في هذه الجلسة", "Progress in this session")),
      progressNote: t(
        common(
          "القراءة والاختبار والتطبيق حالات مستقلة. لا تُرسل إجاباتك أو صورك إلى الخادم، ويُمسح التقدم عند تحديث الصفحة.",
          "Reading, knowledge and practice are separate states. No answers or images are sent to the server. Progress resets when you reload the page.",
        ),
      ),
      front: t(common("المسقط الأمامي", "Front elevation")),
      side: t(common("المسقط الجانبي", "Side elevation")),
      exploded: t(common("خريطة الأجزاء", "Part map")),
      zoom: t(common("فتح الرسم بالحجم الكامل", "Open full-size drawing")),
      downloadPack: t(common("تحميل دليل الدرس والتطبيق PDF", "Download lesson & workbook PDF")),
      downloadParts: t(common("تحميل قائمة القطع JSON", "Download cut list JSON")),
      downloadDrawing: t(common("تحميل الرسم SVG", "Download drawing SVG")),
      videoPending: t(
        common("الفيديو الواقعي لم يُنتج بعد", "Photorealistic video not generated yet"),
      ),
      videoNote: t(
        common(
          "السيناريو وتسلسل المشاهد جاهزان. التوليد ينتظر ربط مزود الفيديو واختبار عينة. الصور المتحركة والرسومات ليست بديلًا عن الفيديو الواقعي المطلوب.",
          "The script and shot sequence are ready. Generation awaits a video-provider connection and sample evaluation. Animated drawings do not substitute for the requested photorealistic footage.",
        ),
      ),
      guideNote: t(
        common(
          "إجابات مرجعية ثابتة من هذا الدرس. مساعد الذكاء الاصطناعي المتصل لم يُربط بهذه التجربة بعد.",
          "Fixed reference answers from this lesson. A connected generative AI assistant is not integrated into this pilot yet.",
        ),
      ),
      worksheet: t(
        common(
          "مهمة جديدة: وحدة 800 عرضًا × 700 ارتفاعًا × 350 عمقًا. سمك الهيكل 18 والظهر الخارجي 6. احتفظ بنفس طريقة التجميع وبفتحتين متساويتين.",
          "New task: a cabinet 800 wide × 700 high × 350 deep. Body thickness is 18 and the overlay back is 6. Retain the same construction and two equal openings.",
        ),
      ),
      assignmentNote: t(
        common(
          "التحقق الآلي أدناه يراجع الحسابات فقط. تقييم الرسم وقائمة الأجزاء وتوثيق الافتراضات يحتاج مراجعة بشرية؛ لا تُمنح شهادة أو كفاءة تصنيع في هذه التجربة.",
          "The automatic check below assesses arithmetic only. Drawings, part lists and documented assumptions need human review. This pilot does not award a certificate or fabrication competence.",
        ),
      ),
      practicalDone: t(
        common(
          "الحسابات صحيحة؛ مراجعة ملف التطبيق لم تُنفذ بعد.",
          "Arithmetic is correct; the practice portfolio has not been reviewed.",
        ),
      ),
      rubric: t(
        common(
          "معايير المراجعة: تطابق الأجزاء بين الرسم والقائمة؛ صحة الأبعاد والكمية؛ تحديد طريقة الظهر والوحدة؛ توثيق ما يحتاج اعتماد الورشة.",
          "Review criteria: consistent drawing/list part IDs; correct dimensions and quantities; declared back construction and units; documented workshop approvals.",
        ),
      ),
      cost: t(common("نموذج التكلفة", "Cost worksheet")),
      costNote: t(
        common(
          "سجّل أسعار المورد بتاريخها، والخامات والإكسسوارات والعمل والتشطيب والنقل. لا توجد أسعار سوق مفترضة في هذا الدرس.",
          "Record dated supplier quotes, materials, hardware, labour, finishing and transport. This lesson assumes no market prices.",
        ),
      ),
      sources: t(common("المصادر وحدود الاستخدام", "Sources & scope")),
      sourceNote: t(
        common(
          "ملف Metwood المقدم: أساسيات التخطيط ص3، تفاصيل الأثاث ص25، الخامات ص97. الأبعاد والمعادلات هنا نموذج هندسي أصلي لهذه التجربة؛ ليست نقلًا لمقاسات الملف ولا اعتمادًا لصحتها جميعًا.",
          "User-supplied Metwood reference: planning p3, furniture details p25, materials p97. This pilot's dimensions and equations are an original teaching example, not copied dimensions or validation of every source page.",
        ),
      ),
    },
    quiz: [
      {
        id: "width",
        question: t(
          common(
            "ما طول السقف الذي يقع بين الجانبين؟",
            "How long is the top fitted between the sides?",
          ),
        ),
        options: ["600 mm", "564 mm", "582 mm"],
        explanation: t(
          common(
            "نطرح سمك الجانبين: 600 − 2 × 18 = 564.",
            "Subtract both side thicknesses: 600 − 2 × 18 = 564.",
          ),
        ),
      },
      {
        id: "depth",
        question: t(
          common(
            "ما عمق أجزاء الهيكل إذا كان العمق النهائي يشمل الظهر؟",
            "What is body-panel depth when the overall depth includes the back?",
          ),
        ),
        options: ["300 mm", "306 mm", "294 mm"],
        explanation: t(
          common(
            "الظهر الخارجي داخل العمق النهائي: 300 − 6 = 294.",
            "The overlay back is included in overall depth: 300 − 6 = 294.",
          ),
        ),
      },
      {
        id: "quantity",
        question: t(common("كم قطعة في هذا النموذج؟", "How many pieces are in this example?")),
        options: ["6", "5", "7"],
        explanation: t(
          common(
            "جانبان + سقف + قاع + رف + ظهر = ست قطع.",
            "Two sides + top + bottom + shelf + back = six pieces.",
          ),
        ),
      },
      {
        id: "release",
        question: t(
          common("ما الخطوة المطلوبة قبل القص الفعلي؟", "What is required before actual cutting?"),
        ),
        options: [
          t(common("اعتماد الصورة المولدة فقط", "Approve only the generated picture")),
          t(
            common(
              "مراجعة الرسم والسماحات والخامة والتثبيت مع مختص",
              "Review drawings, allowances, material and fixings with a specialist",
            ),
          ),
          t(common("شراء الألواح من المساحة الصافية فقط", "Buy stock from net area alone")),
        ],
        explanation: t(
          common(
            "القائمة التعليمية لا تتضمن سماحات تصنيع معتمدة أو توزيع ألواح أو مواصفات تثبيت وحمل.",
            "The teaching list contains no approved machining allowances, board layout, fixing or load specification.",
          ),
        ),
      },
    ],
    faq: [
      {
        question: t(common("لماذا نطرح سمك الجانبين؟", "Why subtract both side thicknesses?")),
        answer: t(
          common(
            "لأن السقف والقاع والرف تقع بين الجانبين. اقرأ فقرة العرض الداخلي؛ لو امتد السقف فوق الجانبين لتغيرت المعادلة.",
            "Because the top, bottom and shelf fit between the sides. See the internal-width section; a top extending over the sides would require different geometry.",
          ),
        ),
        source: "width",
      },
      {
        question: t(common("هل 18 مم قاعدة لكل الأثاث؟", "Is 18 mm a rule for all furniture?")),
        answer: t(
          common(
            "لا. هو افتراض لهذا النموذج فقط. اختيار الخامة والسمك والوصلات والحمل يحتاج اعتمادًا فنيًا للمشروع المحدد.",
            "No. It is an assumption for this example only. Material, thickness, joints and loading require technical approval for the particular project.",
          ),
        ),
        source: "brief",
      },
      {
        question: t(common("كيف أحدد عدد الألواح؟", "How do I determine stock-board quantity?")),
        answer: t(
          common(
            "ابدأ بقائمة القطع، ثم أعد توزيعًا على مقاس اللوح المتاح مع اتجاه الخامة وعرض القطع والسماحات. المساحة الصافية وحدها لا تكفي.",
            "Start with the cut list, then lay out parts on the available stock size with material direction, kerf and allowances. Net area alone is insufficient.",
          ),
        ),
        source: "list",
      },
      {
        question: t(
          common("هل أبدأ تشغيل المنشار بعد الدرس؟", "Can I operate a saw after this lesson?"),
        ),
        answer: t(
          common(
            "هذا درس تخطيط. تشغيل الماكينة يحتاج تدريبًا عمليًا خاصًا بها وإشرافًا وتقييمًا للكفاءة؛ راجع فقرة المراجعة ومصدر HSE.",
            "This is a planning lesson. Machine operation requires machine-specific practical instruction, supervision and assessment. See the review section and HSE reference.",
          ),
        ),
        source: "review",
      },
    ],
  };
}

export type PilotCopy = ReturnType<typeof getPilotCopy>;
