import type { SupportedLocale } from "@/lib/locale/types";

/** Presentation-only, owner-authorized course overviews keyed by exact course id.
 * Unknown courses get null, so callers keep their generic fallback. */
export type CourseOverview = {
  summary: string;
  goals: string;
  audience: string;
  before: string;
  catalogue: string;
};

const OVERVIEWS: Record<string, Record<SupportedLocale, CourseOverview>> = {
  "trip-planning": {
  "en": {
    "summary": "Build and revise a timed, costed day trip using evidence you can check.",
    "audience": "For anyone planning a first independent trip or organising a day out for a companion.",
    "before": "Bring a browser, a calculator and a place to write. The practice case supplies the prices and route. You can finish without buying a ticket or sharing personal details.",
    "goals": "Hand a companion a route with named entrances, realistic transfers, dated costs, an accessible fallback and a revised spending limit.",
    "catalogue": "30 beginner lessons from a travel brief to a revised itinerary you can hand to someone else."
  },
  "ar-EG": {
    "summary": "اعمل جدول ليوم سفر واحسب تكلفته من مصادر تقدر تراجعها.",
    "audience": "للي بيرتّب أول رحلة بنفسه أو بينظّم خروجة مع حد تاني.",
    "before": "جهّز متصفح وآلة حاسبة وورقة أو ملف. هتلاقي الأسعار والمسار في المثال، وتقدر تكمّل من غير ما تحجز أو تشارك بيانات شخصية.",
    "goals": "سلّم لرفيقك خط سير فيه المداخل ووقت التنقل والتكلفة بتاريخها، وبديل يناسب احتياجاته لو الميزانية قلّت.",
    "catalogue": "٣٠ درس للمبتدئ، من تحديد المطلوب لحد جدول رحلة مُراجع ينفع تسلّمه لرفيقك."
  },
  "ar-MSA": {
    "summary": "أنشئ برنامج يوم سفر واحسب تكلفته من مصادر قابلة للتحقق.",
    "audience": "لمن يخطّط لرحلته المستقلة الأولى أو ينظّم يومًا مع رفيق.",
    "before": "جهّز متصفحًا وآلة حاسبة ووسيلة للتدوين. يوفّر المثال الأسعار والمسار، ويمكنك إكمال الدروس دون حجز أو مشاركة بيانات شخصية.",
    "goals": "سلّم رفيقك مسارًا يبيّن المداخل وأوقات التنقل والأسعار المؤرخة وبديلًا يراعي احتياجات الوصول والميزانية الجديدة.",
    "catalogue": "ثلاثون درسًا للمبتدئين، من تحديد المتطلبات إلى تسليم خطة رحلة منقّحة."
  },
  "ar-Gulf": {
    "summary": "رتّب يوم سفر واحسب تكلفته من مصادر تقدر تراجعها.",
    "audience": "للي يرتّب أول رحلة بنفسه أو يخطط لطلعة مع أحد.",
    "before": "جهّز متصفح وآلة حاسبة ومكان تكتب فيه. المثال فيه الأسعار والمسار وتقدر تكمّل من غير حجز أو مشاركة معلومات شخصية.",
    "goals": "عط رفيقك مسار يبيّن المداخل ووقت التنقل والأسعار بتاريخها، وخيار بديل يناسب احتياجاته لو قلّت الميزانية.",
    "catalogue": "٣٠ درس للمبتدئ، من تحديد المطلوب إلى جدول رحلة تقدر تسلّمه لرفيقك."
  }
},
  "audio-stories": {
    "en": {
        "summary": "Write and mix a two-character story that can be followed with eyes closed.",
        "goals": "Direct contrasting performances, build two audible places and test your final mix with a first-time listener.",
        "audience": "For first-time storytellers, podcasters and teachers making a short audio drama.",
        "before": "Bring headphones or a speaker, a way to record your voice, and a willing listener for the final test. No editing experience is required.",
        "catalogue": "For first-time storytellers, podcasters and teachers making a short audio drama. Bring headphones or a speaker, a way to record your voice, and a willing listener for the final test. No editing experience is required."
    },
    "ar-EG": {
        "summary": "اكتب وامزج حكاية بشخصيتين تتفهم وإنت مغمّض عينيك.",
        "goals": "هتوجّه صوتين، وتبني إحساس بمكانين، وتختبر المزيج مع حد بيسمعه لأول مرة.",
        "audience": "للي عايز يعمل أول حكاية صوتية، سواء بيكتب أو بيسجّل بودكاست أو بيدرّس.",
        "before": "جهّز سماعة أو سبيكر، وموبايل أو جهاز تسجّل بيه، وحد يسمع التجربة الأخيرة. تقدر تبدأ من غير خبرة مونتاج.",
        "catalogue": "للي عايز يعمل أول حكاية صوتية، سواء بيكتب أو بيسجّل بودكاست أو بيدرّس. جهّز سماعة أو سبيكر، وموبايل أو جهاز تسجّل بيه، وحد يسمع التجربة الأخيرة. تقدر تبدأ من غير خبرة مونتاج."
    },
    "ar-MSA": {
        "summary": "اكتب قصة بشخصيتين وامزج أصواتها حتى يسهل تتبّعها بالاستماع وحده.",
        "goals": "ستوجّه أداء الشخصيتين وتبني بيئتين مسموعتين وتختبر المزيج مع مستمع جديد.",
        "audience": "للمبتدئين في كتابة القصص أو إنتاج البودكاست أو إعداد الحكايات التعليمية.",
        "before": "تحتاج إلى سماعة أو مكبّر صوت ووسيلة لتسجيل صوتك وشخص يستمع إلى الاختبار النهائي. لا تحتاج إلى خبرة سابقة في المونتاج.",
        "catalogue": "للمبتدئين في كتابة القصص أو إنتاج البودكاست أو إعداد الحكايات التعليمية. تحتاج إلى سماعة أو مكبّر صوت ووسيلة لتسجيل صوتك وشخص يستمع إلى الاختبار النهائي. لا تحتاج إلى خبرة سابقة في المونتاج."
    },
    "ar-Gulf": {
        "summary": "اكتب حكاية بشخصيتين وامزج أصواتها عشان المستمع يتابعها وهو مغمّض عيونه.",
        "goals": "بتوجّه أداء الصوتين وتبني مكانين بالمؤثّرات وتجرّب المزيج مع شخص يسمعه لأول مرّة.",
        "audience": "للي ودّه يسوي أول قصة صوتية، من كتّاب الحكايات وصنّاع البودكاست والمعلّمين.",
        "before": "جهّز سمّاعة أو مكبّر صوت وجهاز تسجّل فيه، واتّفق مع شخص يسمع التجربة الأخيرة. ما تحتاج خبرة مونتاج.",
        "catalogue": "للي ودّه يسوي أول قصة صوتية، من كتّاب الحكايات وصنّاع البودكاست والمعلّمين. جهّز سمّاعة أو مكبّر صوت وجهاز تسجّل فيه، واتّفق مع شخص يسمع التجربة الأخيرة. ما تحتاج خبرة مونتاج."
    }
},
  "tabletop-game": {
  "en": {
    "summary": "Design, print and test a complete tabletop game.",
    "goals": "Write rules that a new pair can use, trace a four-round match, compare balanced variants and document one revision from evidence.",
    "audience": "Adults making their first tabletop game. No coding or prior design experience required.",
    "before": "Bring paper, scissors and a pencil. Use a printer or access to one. Arrange two consenting first-time players for the blind playtest.",
    "catalogue": "32 workshops build from one meaningful choice to a printable game, a tested rulebook and a design defense."
  },
  "ar-EG": {
    "summary": "صمّم لعبة ورقية واطبعها وجرّبها مع لاعبين بيشوفوها لأول مرة.",
    "goals": "اكتب قواعد تنفع من غير شرح، واحسب نتيجة أربع جولات، وغيّر عامل واحد واختبر أثره، ووثّق التعديل بدليل.",
    "audience": "لأي حد كبير بيصمّم أول لعبة طاولة. تقدر تبدأ من غير خبرة في التصميم أو البرمجة.",
    "before": "جهّز ورق ومقص وقلم وطريقة تطبع بيها. اتفق مع اتنين حابّين يجرّبوا اللعبة لأول مرة.",
    "catalogue": "٣٢ ورشة من أول قرار اللاعب لحد لعبة مطبوعة وورقة قواعد وسجل يبيّن إيه اللي اتغيّر بعد التجربة."
  },
  "ar-MSA": {
    "summary": "صمّم لعبة طاولة واطبع مكوناتها واختبر قواعدها مع لاعبين جديدين.",
    "goals": "اكتب قواعد مستقلة، وتتبّع مباراة من أربع جولات، وقارن أثر تعديل واحد، ووثّق قرارك بدليل.",
    "audience": "للبالغين الذين يصمّمون أول لعبة طاولة. لا يُشترط إتقان البرمجة أو التصميم.",
    "before": "تحتاج إلى ورق ومقص وقلم وإمكانية الطباعة، ولاعبين يوافقان على تجربة اللعبة للمرة الأولى.",
    "catalogue": "٣٢ ورشة تبدأ بقرار اللاعب وتنتهي بلعبة قابلة للطباعة ودليل قواعد وسجل مراجعة."
  },
  "ar-Gulf": {
    "summary": "صمّم لعبة ورقية واطبع مكوّناتها وجرّبها مع لاعبين جدد.",
    "goals": "اكتب قواعد يقدر غيرك يتبعها، واحسب نتيجة أربع جولات، وجرّب تغيّر عامل واحد ووثّق اللي حصل.",
    "audience": "للكبار اللي يصمّمون أول لعبة طاولة. تقدر تبدأ بدون خبرة في التصميم أو البرمجة.",
    "before": "جهّز ورق ومقص وقلم وطريقة تطبع فيها. اتفق مع لاعبين ودّهم يجرّبون اللعبة لأول مرة.",
    "catalogue": "٣٢ ورشة من أول قرار للاعب لين لعبة مطبوعة وقواعد وسجل يوضّح التعديلات بعد التجربة."
  }
},
  "picture-book": {
  "en": {
    "summary": "Create an original Arabic picture book and prepare its print files.",
    "goals": "Write for a particular listener, illustrate seven facing-page scenes, time a reading and revise one confusing spread.",
    "audience": "For adult beginners who want to write and illustrate a first Arabic picture book.",
    "before": "Bring paper, a pencil and a phone timer. Use a layout editor that exports PDF. Arrange a willing listener for your own read-aloud trial.",
    "catalogue": "32 workshops take a story from its first sketch to a right-bound book and a publication package."
  },
  "ar-EG": {
    "summary": "اكتب حكاية أطفال بالعربي وارسمها وجهّز ملفاتها للمطبعة.",
    "goals": "حدّد مين هيسمع الحكاية، وارسم سبعة مشاهد، ووقّت القراءة، وعدّل المشهد اللي حيّر المستمع.",
    "audience": "لأي حد كبير عايز يعمل أول كتاب أطفال مصوّر بالعربي، حتى لو دي أول مرة يرسم أو يكتب.",
    "before": "جهّز ورق وقلم ومؤقت على الموبايل وبرنامج يصدّر PDF. اتّفق مع حد حابب يسمع تجربة القراءة.",
    "catalogue": "٣٢ ورشة من أول سكتش لحد كتاب بيتفتح من اليمين وحزمة جاهزة تراجعها مع المطبعة."
  },
  "ar-MSA": {
    "summary": "ألّف كتاب أطفال عربيًا مصوّرًا وجهّز ملفاته للطباعة.",
    "goals": "حدّد جمهور القصة، وارسم سبعة مشاهد متقابلة الصفحات، وقِس زمن القراءة وعدّل مشهدًا أربك المستمع.",
    "audience": "للبالغين الذين يكتبون ويرسمون أول كتاب أطفال بالعربية. تكفي مهارات الرسم الأولية.",
    "before": "تحتاج إلى ورق وقلم ومؤقت وبرنامج تنسيق يصدّر ملفات PDF. اتّفق مع مستمع يشارك طوعًا في تجربة القراءة.",
    "catalogue": "٣٢ ورشة تنتقل بك من التخطيط إلى كتاب بتجليد عربي وحزمة نشر موثّقة."
  },
  "ar-Gulf": {
    "summary": "اكتب قصّة أطفال بالعربي وارسمها وجهّز ملفاتها للمطبعة.",
    "goals": "حدّد مين بيسمع القصّة، وارسم سبعة مشاهد، ووقّت القراءة وعدّل المشهد اللي حيّر المستمع.",
    "audience": "للكبار اللي ودّهم يسوّون أول كتاب أطفال مصوّر بالعربي، حتى لو توّهم يبدون.",
    "before": "جهّز ورق وقلم ومؤقت بالجوال وبرنامج يصدّر PDF. اتّفق مع شخص ودّه يسمع تجربتك.",
    "catalogue": "٣٢ ورشة من الرسمة الأولى لين كتاب يفتح من اليمين وملفات تراجعها مع المطبعة."
  }
},
  "animation-film": {
  "ar-EG": {
    "summary": "حوّل فكرة صغيرة لفيلم أنيميشن أصلي مدته من ٦٠ لـ٩٠ ثانية، واعمل له نهاية تانية.",
    "goals": "هترسم مرجع لشخصياتك، وتوقّت اللقطات والحوار، وتختبر استمرارية الحركة بين نهايتين لفيلمك.",
    "audience": "للمبتدئين اللي عايزين يحكوا قصة بالصور المتحركة. ينفع تبدأ برسومات ورق بسيطة.",
    "before": "جهّز ورق وقلم، وموبايل أو كمبيوتر عليه مسجّل صوت ومحرّر فيديو بخط زمني. هتحتاج حد يشوف النسخة الأولية ويديك ملاحظة.",
    "catalogue": "٣٦ درس عملي من أول ثلاث رسومات لحد عرض فيلمك وتجربة نهاية مختلفة."
  },
  "ar-MSA": {
    "summary": "أنجز فيلم رسوم متحركة أصليًا مدته ٦٠–٩٠ ثانية، ثم ابتكر له نهاية بديلة.",
    "goals": "ارسم مرجعًا للشخصيات، واضبط توقيت اللقطات والحوار، واختبر استمرارية الحركة والعناصر عند تغيير النهاية.",
    "audience": "للمبتدئين الراغبين في سرد قصة بالصور المتحركة. تكفي رسومات ورقية بسيطة للبدء.",
    "before": "جهّز ورقًا وقلمًا وهاتفًا أو حاسوبًا بمسجّل صوت ومحرّر فيديو ذي خط زمني. ستحتاج إلى مشاهد يعلّق على النسخة الأولية.",
    "catalogue": "٣٦ درسًا عمليًا من الرسوم المصغّرة الأولى إلى عرض الفيلم وتنفيذ نهاية بديلة."
  },
  "ar-Gulf": {
    "summary": "حوّل فكرتك لفيلم أنيميشن أصلي مدته من ٦٠ إلى ٩٠ ثانية وجرّب له نهاية ثانية.",
    "goals": "ترسم مرجع لشخصياتك، وتضبط وقت اللقطات والحوار، وتشيّك على استمرارية الحركة والأغراض يوم تغيّر النهاية.",
    "audience": "للمبتدئين اللي ودّهم يحكون قصة بالصور المتحركة. تقدر تبدأ برسومات بسيطة على الورق.",
    "before": "جهّز ورق وقلم وجوال أو كمبيوتر فيه مسجّل صوت ومحرّر فيديو بخط زمني. بتحتاج شخص يشوف النسخة الأولية ويعطيك ملاحظته.",
    "catalogue": "٣٦ درس عملي من أول رسومات صغيرة لين عرض فيلمك وتجربة نهاية ثانية."
  },
  "en": {
    "summary": "Make an original 60–90 second animated short, then give the same story a different ending.",
    "goals": "Build a character sheet, time dialogue and shots, and test movement and prop continuity at the cut between two endings.",
    "audience": "For first-time animators who want to tell a story with moving pictures. Simple paper drawings are enough to start.",
    "before": "Bring paper, a pencil, and a phone or computer with a voice recorder and a timeline video editor. Ask someone to watch your rough cut.",
    "catalogue": "36 practical lessons from the first three thumbnail sketches to a screening and an alternate ending."
  }
},
  "home-design": {
    "ar-EG": {
      summary: "صمّم أوضتك بالمقاسات وجرّب العفش في مكانه قبل ما تدفع.",
      goals: "هتقارن توزيعتين، وتختبر فتح الباب والأدراج والمشي بين العفش، وتحسب التكلفة بالتوصيل والتركيب.",
      audience: "للي بيرتّب بيته أو شقة إيجار لأول مرة وعايز يختار عفش يناسب استخدامه اليومي.",
      before: "جهّز متر وورقة وقلم، واختار أوضة مسموح لك تقيسها. تقدر تبدأ من غير خبرة في الرسم.",
      catalogue: "قيس أوضتك وقارن توزيعتين بالعفش والميزانية قبل الشراء.",
    },
    "ar-MSA": {
      summary: "صمّم غرفتك من واقع قياساتها واختبر مواضع الأثاث قبل الشراء.",
      goals: "ستقارن بين توزيعَين، وتختبر فتح الأبواب والأدراج ومسارات الحركة، وتحسب التكلفة شاملة التوصيل والتركيب.",
      audience: "للمبتدئين الذين يرتّبون منزلًا أو غرفة مستأجرة ويريدون اختيار أثاث يلائم استخدامهم اليومي.",
      before: "جهّز شريط قياس وورقة وقلمًا واختر غرفة لديك إذن بقياسها. يمكنك البدء دون خبرة سابقة في الرسم.",
      catalogue: "قِس غرفتك وقارن بين توزيعَين وفق الملاءمة والميزانية قبل الشراء.",
    },
    "ar-Gulf": {
      summary: "صمّم غرفتك على مقاسها وجرّب مكان الأثاث قبل ما تدفع.",
      goals: "بتقارن توزيعين وتختبر فتح الباب والأدراج ومسارات الحركة وتحسب التكلفة مع التوصيل والتركيب.",
      audience: "للي يرتّب بيته أو غرفة مستأجرة لأول مرة ويبي يختار أثاث يناسب استخدامه اليومي.",
      before: "جهّز متر وورقة وقلم واختَر غرفة مسموح لك تقيسها. تقدر تبدأ بدون خبرة في الرسم.",
      catalogue: "قِس غرفتك وقارن توزيعين على حسب المساحة والميزانية قبل الشراء.",
    },
    en: {
      summary: "Measure your room and test where furniture will go before you buy it.",
      goals: "Compare two layouts, test door and drawer movement, check the routes people use and calculate the cost with delivery and assembly.",
      audience: "For beginners furnishing their home or a rented room who want to check everyday fit before buying.",
      before: "Bring a tape measure, paper and a pencil, and choose a room you have permission to measure. No drawing experience is needed.",
      catalogue: "Compare two room layouts against your measurements, daily activities and budget.",
    },
  },
  "family-archive": {
    en: {
      summary: "Turn a family picture and a remembered voice into a searchable archive.",
      goals:
        "Preserve originals, transcribe Arabic with uncertainty, link a claim to its source, and test an audience-specific listening copy.",
      audience:
        "For beginners who want to organize photographs and recorded memories. The practice collection is fictional.",
      before:
        "You need a browser, headphones or speakers, and the ability to copy a file. The recordings are in Egyptian Arabic, with source text for comparison.",
      catalogue: "Build and test a searchable family archive in 30 lessons.",
    },
    "ar-EG": {
      summary: "حوّل صورة وصوت بيحكي عنها لأرشيف عائلي تقدر تدوّر فيه.",
      goals:
        "هتحفظ الأصل، وتفرّغ الكلام العربي وتعلّم على مواضع الشك، وتربط الصورة بالمقطع، وتختبر نسخة العيلة.",
      audience: "للمبتدئين اللي عايزين يرتّبوا الصور والذكريات الصوتية. مواد التدريب كلها خيالية.",
      before:
        "محتاج متصفح وسماعات أو مكبر صوت، وتعرف تنسخ ملف. التسجيلات بالمصري ومعاها الكلام المكتوب للمقارنة.",
      catalogue: "اعمل أرشيف عائلي ينفع تدور فيه وتراجع مصدر كل حكاية في ٣٠ درس.",
    },
    "ar-MSA": {
      summary: "حوّل الصور والشهادات الصوتية إلى أرشيف عائلي قابل للبحث.",
      goals:
        "احفظ الأصول وفرّغ الكلام العربي مع توثيق الشك واربط الصورة بمقطعها واختبر نسخة استماع مخصّصة للعائلة.",
      audience: "للمبتدئين الراغبين في تنظيم الصور والذكريات المسجّلة. جميع مواد التدريب خيالية.",
      before:
        "تحتاج إلى متصفّح وسماعات أو مكبّر صوت والقدرة على نسخ ملف. التسجيلات التدريبية بالمصرية ويصاحبها نص للمقارنة.",
      catalogue: "أنشئ أرشيفًا عائليًا قابلًا للبحث واختبر مصادره في ٣٠ درسًا.",
    },
    "ar-Gulf": {
      summary: "حوّل صورة وصوت يحكي عنها لأرشيف عائلي تقدر تبحث فيه.",
      goals:
        "بتحفظ الأصل وتفرّغ الكلام العربي وتبيّن مواضع الشك، وتربط الصورة بالمقطع وتختبر نسخة الأهل.",
      audience: "للمبتدئين اللي ودّهم يرتّبون الصور والذكريات المسجّلة. مواد التدريب كلها خيالية.",
      before:
        "تحتاج متصفّح وسماعات وتعرف تنسخ ملف. التسجيلات التدريبية بالمصري ومعها النص عشان تقارن.",
      catalogue: "سوّ أرشيف عائلي قابل للبحث واختبر مصدر كل رواية في ٣٠ درس.",
    },
  },
  "personal-tutor": {
    "ar-EG": {
      summary: "حوّل صفحة من ملفاتك لجلسة مذاكرة مع مدرّس AI، وراجع كل تصحيح على السطر اللي يسنده.",
      goals: "هتكشف سبب الغلط، وتعمل تدريب على قدّه، وتحل حالة جديدة لوحدك وتراجع تصحيحها بالدليل.",
      audience: "للطلبة والمتعلّمين ذاتيًا اللي عايزين يذاكروا من ملفاتهم ويتأكدوا من إجابات المساعد.",
      before: "جهّز صفحة مسموح لك تستخدمها أو ابدأ بدليل الإعارة الخيالي المرفق. محتاج تعرف تقرا فقرة قصيرة وتكتب إجابتك.",
      catalogue: "ذاكر من ملفاتك واختبر نفسك في حالة جديدة قبل ما تطلب التصحيح.",
    },
    "ar-MSA": {
      summary: "حوّل صفحة من ملفاتك إلى جلسة مذاكرة مع مدرّس ذكي وتحقّق من كل تصحيح في مصدره.",
      goals: "ستشخّص مفهومًا خاطئًا، وتصمّم تدريبًا لاستدراكه، وتحل حالة جديدة باستقلال وتدقّق تصحيحها.",
      audience: "للطلاب والمتعلّمين ذاتيًا الذين يدرسون من ملفاتهم ويريدون فحص إجابات المساعد.",
      before: "جهّز صفحة مأذونًا لك باستخدامها أو ابدأ بدليل الإعارة الخيالي المرفق. تحتاج إلى قراءة فقرة قصيرة وكتابة إجابة.",
      catalogue: "ذاكر من ملفاتك واختبر نفسك في حالة جديدة قبل طلب التصحيح.",
    },
    "ar-Gulf": {
      summary: "حوّل صفحة من ملفاتك لجلسة دراسة مع مدرّس ذكي وشيّك على تصحيحه من المصدر.",
      goals: "بتكتشف سبب الغلط وتصمّم تدريب يناسبه وتحل حالة يديدة بروحك وتدقّق تصحيحها بالدليل.",
      audience: "للطلبة واللي يتعلّمون بروحهم ويبون يدرسون من ملفاتهم ويتأكّدون من أجوبة المساعد.",
      before: "جهّز صفحة مسموح لك تستخدمها أو ابدأ بدليل الإعارة الخيالي المرفق. تحتاج تقرا فقرة قصيرة وتكتب جوابك.",
      catalogue: "ادرس من ملفاتك واختبر نفسك بحالة يديدة قبل تطلب التصحيح.",
    },
    en: {
      summary: "Turn a page you own into a study session with an AI tutor and check its feedback against the source.",
      goals: "Diagnose a misconception, design targeted practice, solve a fresh case independently and audit the marking clause by clause.",
      audience: "For students and independent learners who want to study from their own materials and check a tutor’s answers.",
      before: "Bring a page you have permission to use, or start with the supplied fictional lending guide. You need to be able to read a short paragraph and write a response.",
      catalogue: "Study from your files and try an unfamiliar case before asking for feedback.",
    },
  },
  "ai-store-studio": {
    "ar-EG": {
      summary: "ابنِ متجر دَوِّنها من أول كتالوج المنتجات لحد اختبار الطلب وتسليم المتجر.",
      goals: "تضبط المنتجات والمخزون والشحن، وتختبر الدفع ورفض الطلب، وتسلّم دليل تشغيل المتجر.",
      audience:
        "لأصحاب المتاجر المبتدئين ومصممي واجهات المتاجر اللي بيبدأوا في التجارة الإلكترونية.",
      before:
        "يكفي تعرف تستخدم المتصفح وتدخل بيانات في جدول. جهّز متجر تدريب وحساب للأداة اللي هتطبّق عليها.",
      catalogue: "ابنِ متجرًا بأدوات الذكاء الاصطناعي واختبر طلبًا كاملًا.",
    },
    "ar-MSA": {
      summary: "ابنِ متجر دَوِّنها من إعداد الكتالوج إلى اختبار الطلب وتسليم المتجر.",
      goals: "ستضبط المنتجات والمخزون والشحن، وتختبر الدفع ورفض الطلب، وتسلّم أدلة التشغيل.",
      audience: "لمؤسسي المتاجر ومصممي واجهاتها المبتدئين في التجارة الإلكترونية.",
      before:
        "تحتاج إلى استخدام المتصفح وإدخال بيانات في جدول. جهّز متجرًا تدريبيًا وحسابًا للأداة التي ستطبّق بها.",
      catalogue: "ابنِ متجرًا بأدوات الذكاء الاصطناعي واختبر طلبًا كاملًا.",
    },
    "ar-Gulf": {
      summary: "ابنِ متجر دَوِّنها من تجهيز الكتالوج لين تختبر الطلب وتسلّم المتجر.",
      goals: "بتضبط المنتجات والمخزون والشحن، وتجرّب الدفع ورفض الطلب، وتسلّم أدلة التشغيل.",
      audience: "للي يبدأ مشروع متجر إلكتروني أو يصمّم واجهة متجر لأول مرة.",
      before:
        "يكفي تعرف تستخدم المتصفح وتدخل بيانات بجدول. جهّز متجر تدريب وحساب للأداة اللي بتطبّق عليها.",
      catalogue: "ابنِ متجر بأدوات الذكاء الاصطناعي وجرّب طلب كامل.",
    },
    en: {
      summary:
        "Build the Dawwenha store from its product catalogue to a tested order and handover.",
      goals:
        "Configure products, inventory and shipping, test checkout and declined orders, and hand over operating evidence.",
      audience: "For first-time store founders and beginning storefront designers.",
      before:
        "You should be able to use a browser and enter data in a spreadsheet. Have a practice store and an account for the tool you plan to use.",
      catalogue: "Build an online store with AI tools and test a complete order.",
    },
  },
  "english-speaking": {
    "ar-EG": {
      summary: "اتدرّب على محادثة إنجليزي من أول تسجيل ليك لحد موقف جديد.",
      goals: "تسمع وتردّ، وتطلب توضيح، وتقارن أداءك في أول وآخر محادثة.",
      audience: "للي عايز يستخدم الإنجليزي في مواقف يومية ويتدرّب على ردود مش محفوظة.",
      before: "اختار موقف يومي يهمك، وجهّز وسيلة تسمع بيها وتسجّل صوتك.",
      catalogue: "اتدرّب على محادثة إنجليزي من أول تسجيل ليك لحد موقف جديد.",
    },
    "ar-MSA": {
      summary: "تدرّب على المحادثة الإنجليزية ثم اختبر أداءك في موقف جديد.",
      goals: "تتدرّب على الاستماع والرد وطلب التوضيح ومراجعة النطق.",
      audience: "لمن يريد استخدام الإنجليزية في محادثات الحياة اليومية.",
      before: "اختر موقفًا يوميًا وجهّز وسيلة للاستماع وتسجيل صوتك.",
      catalogue: "تدرّب على المحادثة الإنجليزية ثم اختبر أداءك في موقف جديد.",
    },
    "ar-Gulf": {
      summary: "تمرّن على محادثة إنجليزية وجرّب كلامك في موقف جديد.",
      goals: "بتتمرّن على الاستماع والرد وطلب التوضيح وبتقارن تسجيلاتك.",
      audience: "للي يبي يستخدم الإنجليزية في المحادثات اليومية.",
      before: "اختَر موقف يومي يهمّك وجهّز وسيلة تسمع فيها وتسجّل صوتك.",
      catalogue: "تمرّن على محادثة إنجليزية وجرّب كلامك في موقف جديد.",
    },
    en: {
      summary: "Practise speaking English and hold a conversation in a new situation.",
      goals: "Listen, respond, ask for clarification and compare your first and final attempts.",
      audience: "For learners who want to use English in everyday conversations.",
      before: "Choose a familiar situation and prepare a way to listen and record your voice.",
      catalogue: "Practise speaking English and hold a conversation in a new situation.",
    },
  },
  "job-interviews": {
    "ar-EG": {
      summary: "حوّل إعلان شغل لطلب تقديم ومقابلة مبنيين على خبرتك.",
      goals: "تربط متطلبات الإعلان بأمثلة، وتعدّل السيرة، وتجاوب على أسئلة متابعة.",
      audience: "للي بيدوّر على شغل وعايز يشرح خبرته بوضوح في التقديم والمقابلة.",
      before: "جهّز إعلان لوظيفة مهتم بيها وأمثلة حقيقية من شغلك أو دراستك.",
      catalogue: "حوّل إعلان شغل لطلب تقديم ومقابلة مبنيين على خبرتك.",
    },
    "ar-MSA": {
      summary: "حوّل إعلان وظيفة إلى طلب توظيف ومقابلة تستندان إلى خبرتك الفعلية.",
      goals: "اربط متطلبات الدور بأدلة، وخصّص سيرتك الذاتية وتدرّب على أسئلة المتابعة.",
      audience: "للباحثين عن عمل الراغبين في تقديم خبراتهم بوضوح.",
      before: "جهّز إعلانًا لوظيفة تهمّك وأمثلة حقيقية من عملك أو دراستك.",
      catalogue: "حوّل إعلان وظيفة إلى طلب توظيف ومقابلة تستندان إلى خبرتك الفعلية.",
    },
    "ar-Gulf": {
      summary: "جهّز طلبك للمقابلة على أساس إعلان الوظيفة وخبرتك الفعلية.",
      goals: "بتربط متطلبات الوظيفة بأمثلة وبتخصّص سيرتك وتتمرّن على أسئلة المتابعة.",
      audience: "للي يدور على وظيفة ويبي يعرض خبرته بوضوح.",
      before: "جهّز إعلان وظيفة يهمّك وأمثلة حقيقية من شغلك أو دراستك.",
      catalogue: "جهّز طلبك للمقابلة على أساس إعلان الوظيفة وخبرتك الفعلية.",
    },
    en: {
      summary: "Turn a job posting into an application and interview grounded in your experience.",
      goals:
        "Map the requirements to evidence, tailor your CV and practise answering follow-up questions.",
      audience:
        "For job seekers who want to explain their experience in applications and interviews.",
      before: "Bring a job posting and real examples from your work or studies.",
      catalogue:
        "Turn a job posting into an application and interview grounded in your experience.",
    },
  },
  "AC-FATE": {
    "ar-EG": {
      summary:
        "افهم رحلة المبيد من استخدامه لحد انتقاله وتحلّله في البيئة، واتعلّم تقرأ بيانات المتبقيات والتعرّض والسميّة وتربط بينها باستنتاج علمي عليه دليل.",
      goals:
        "هتتعلّم تفسّر نتائج متبقيات المبيدات ووحدات قياسها، وتحسب الكمية في سيناريو محدد، وتفصل بين التركيز والتعرّض والخطر. وهتتتبّع حركة المبيد بين التربة والمياه والكائنات، وتقارن التراكم والتركيز والتضخّم الحيوي، وتقرأ اختبارات السميّة والخواص الفيزيائية والكيميائية والتحلّل وعمر النصف.",
      audience:
        "لطلاب الزراعة والعلوم البيئية، ولكل مهتم بفهم مصير المبيدات وسلامة الغذاء وتقييم الأدلة البيئية. مناسب للي عايز يفهم الأرقام والعلاقات ويطبّق التفكير العلمي على حالات واقعية.",
      before:
        "ابدأ من أول خطوة وامشِ بالترتيب؛ المفاهيم والحسابات بتتبني على بعض. جهّز ورقة وقلم وآلة حاسبة بسيطة، وراجع تحويلات الجرام والكيلوجرام وقراءة النسب والوحدات. هتلاقي شرحًا وأمثلة محلولة وأسئلة وتطبيقات تساعدك تبني فهمك تدريجيًا.",
      catalogue:
        "افهم انتقال المبيدات وتحلّلها وتراكمها في البيئة، واتعلّم تفسير بيانات المتبقيات والتعرّض والسميّة.",
    },
    "ar-MSA": {
      summary:
        "افهم رحلة المبيد منذ استخدامه حتى انتقاله وتحلّله في البيئة، وتعلّم قراءة بيانات المتبقيات والتعرّض والسميّة والربط بينها باستنتاج علمي مدعوم بالدليل.",
      goals:
        "ستتعلّم تفسير نتائج متبقيات المبيدات ووحدات قياسها، وحساب الكمية في سيناريو محدد، والتمييز بين التركيز والتعرّض والخطر. وستتتبّع حركة المبيد بين التربة والمياه والكائنات الحية، وتقارن بين التراكم والتركيز والتضخّم الحيوي، وتقرأ اختبارات السميّة والخواص الفيزيائية والكيميائية والتحلّل وعمر النصف.",
      audience:
        "لطلاب الزراعة والعلوم البيئية، ولكل مهتم بفهم مصير المبيدات وسلامة الغذاء وتقييم الأدلة البيئية. مناسب لمن يريد فهم الأرقام والعلاقات وتطبيق التفكير العلمي على حالات واقعية.",
      before:
        "ابدأ من الخطوة الأولى وتابع بالترتيب؛ فالمفاهيم والحسابات يبني بعضها على بعض. جهّز ورقة وقلمًا وآلة حاسبة بسيطة، وراجع التحويل بين الجرام والكيلوجرام وقراءة النسب والوحدات. ستجد شرحًا وأمثلة محلولة وأسئلة وتطبيقات تساعدك على بناء فهمك تدريجيًا.",
      catalogue:
        "افهم انتقال المبيدات وتحلّلها وتراكمها في البيئة، وتعلّم تفسير بيانات المتبقيات والتعرّض والسميّة.",
    },
    "ar-Gulf": {
      summary:
        "افهم رحلة المبيد من استخدامه إلى انتقاله وتحلّله في البيئة، وتعلّم تقرا بيانات المتبقيات والتعرّض والسميّة وتربط بينها باستنتاج علمي عليه دليل.",
      goals:
        "بتتعلّم تفسّر نتائج متبقيات المبيدات ووحدات قياسها، وتحسب الكمية في سيناريو محدد، وتفرّق بين التركيز والتعرّض والخطر. وبتتتبّع حركة المبيد بين التربة والمياه والكائنات، وتقارن بين التراكم والتركيز والتضخّم الحيوي، وتقرا اختبارات السميّة والخواص الفيزيائية والكيميائية والتحلّل وعمر النصف.",
      audience:
        "لطلاب الزراعة والعلوم البيئية، ولكل مهتم يبي يفهم مصير المبيدات وسلامة الغذاء وتقييم الأدلة البيئية. يناسب اللي يبي يفهم الأرقام والعلاقات ويطبّق التفكير العلمي على حالات واقعية.",
      before:
        "ابدأ من أول خطوة وامشِ بالترتيب؛ المفاهيم والحسابات تنبني على بعض. جهّز ورقة وقلم وآلة حاسبة بسيطة، وراجع تحويلات الجرام والكيلوجرام وقراءة النسب والوحدات. بتلقى شرح وأمثلة محلولة وأسئلة وتطبيقات تساعدك تبني فهمك شوي شوي.",
      catalogue:
        "افهم انتقال المبيدات وتحلّلها وتراكمها في البيئة، وتعلّم تفسير بيانات المتبقيات والتعرّض والسميّة.",
    },
    en: {
      summary:
        "Follow a pesticide's journey from application to its movement and breakdown in the environment, and learn to read residue, exposure and toxicity data and connect them into evidence-based scientific conclusions.",
      goals:
        "You will learn to interpret pesticide residue results and their units, calculate quantities in a defined scenario, and distinguish concentration, exposure and risk. You will trace how a pesticide moves between soil, water and organisms, compare accumulation, concentration and biomagnification, and read toxicity tests, physical and chemical properties, degradation and half-life.",
      audience:
        "For agriculture and environmental science students, and anyone interested in pesticide fate, food safety and weighing environmental evidence. Suited to learners who want to understand the numbers and relationships and apply scientific thinking to real cases.",
      before:
        "Start at the first step and work in order; the concepts and calculations build on each other. Have paper, a pen and a simple calculator ready, and review gram–kilogram conversions and reading ratios and units. You will find explanations, worked examples, questions and practice that help you build understanding step by step.",
      catalogue:
        "Understand how pesticides move, break down and accumulate in the environment, and learn to interpret residue, exposure and toxicity data.",
    },
  },
};

export function courseOverview(courseId: string, locale: SupportedLocale): CourseOverview | null {
  return Object.hasOwn(OVERVIEWS, courseId) ? OVERVIEWS[courseId][locale] : null;
}
