import type { SupportedLocale } from "@/lib/locale/types";

const copy = {
  "ar-EG": {
    browse: "تصفح المناهج",
    title: "فهم واضح، وتطبيق خطوة بخطوة",
    body: "مسارات أكاديمي بيجمع مناهج منظمة تساعدك تفهم المفاهيم وتستخدمها في مواقف عملية. اختار المنهج المناسب، وبعدها ادخل على محطاته وخطواته.",
    features: [
      { title: "شرح وأمثلة", body: "افهم الفكرة من شرح مكتوب ومثال محلول مرتبط بموضوع الخطوة." },
      { title: "اختبار وتطبيق", body: "راجع فهمك بأسئلة، وطبّق اللي اتعلمته في نشاط عملي." },
      { title: "حساب واحد", body: "احتفظ بتقدمك في حساب مسارات نفسه، مع صلاحية مستقلة لكل مجال." },
    ],
    journey: "طريقك جوّه أكاديمي",
    steps: [
      "تصفح كروت المناهج واختار موضوعك.",
      "افتح المنهج وشوف الوحدات والخطوات بالترتيب.",
      "ادخل الخطوة واقرأ وراجع وطبّق.",
    ],
    courses: "كل منهج له مكانه",
    coursesBody:
      "صفحة المناهج بتجمع المسارات المتاحة ليك في كروت مستقلة. كل كارت بيفتح خطوات منهجه، وأي منهج جديد بيتضاف في نفس المكان.",
  },
  "ar-MSA": {
    browse: "تصفح المناهج",
    title: "فهم واضح وتطبيق متدرّج",
    body: "تجمع مسارات أكاديمي مناهج منظّمة تساعدك على فهم المفاهيم واستخدامها في مواقف عملية. اختر المنهج المناسب، ثم استعرض محطاته وخطواته.",
    features: [
      { title: "شرح وأمثلة", body: "افهم الفكرة من شرح مكتوب ومثال محلول مرتبط بموضوع الخطوة." },
      { title: "اختبار وتطبيق", body: "راجع فهمك بالأسئلة، وطبّق ما تعلمته في نشاط عملي." },
      { title: "حساب موحّد", body: "احتفظ بتقدمك في حساب مسارات نفسه، مع صلاحية مستقلة لكل مجال." },
    ],
    journey: "رحلتك داخل أكاديمي",
    steps: [
      "تصفح بطاقات المناهج واختر موضوعك.",
      "افتح المنهج واستعرض الوحدات والخطوات بالترتيب.",
      "ادخل الخطوة واقرأ وراجع وطبّق.",
    ],
    courses: "مساحة مستقلة لكل منهج",
    coursesBody:
      "تجمع صفحة المناهج المسارات المتاحة لك في بطاقات مستقلة. تفتح كل بطاقة خطوات منهجها، وتُضاف المناهج الجديدة في الصفحة نفسها.",
  },
  "ar-Gulf": {
    browse: "تصفح المناهج",
    title: "فهم واضح، وتطبيق خطوة بخطوة",
    body: "مسارات أكاديمي يجمع مناهج منظّمة تساعدك تفهم المفاهيم وتستخدمها في مواقف عملية. اختر المنهج المناسب، وبعدها شوف محطاته وخطواته.",
    features: [
      { title: "شرح وأمثلة", body: "افهم الفكرة من شرح مكتوب ومثال محلول مرتبط بموضوع الخطوة." },
      { title: "اختبار وتطبيق", body: "راجع فهمك بالأسئلة، وطبّق اللي تعلمته في نشاط عملي." },
      { title: "حساب واحد", body: "احتفظ بتقدمك في حساب مسارات نفسه، مع صلاحية مستقلة لكل مجال." },
    ],
    journey: "رحلتك داخل أكاديمي",
    steps: [
      "تصفح بطاقات المناهج واختر موضوعك.",
      "افتح المنهج وشوف الوحدات والخطوات بالترتيب.",
      "ادخل الخطوة واقرأ وراجع وطبّق.",
    ],
    courses: "كل منهج له مكانه",
    coursesBody:
      "صفحة المناهج تجمع المسارات المتاحة لك في بطاقات مستقلة. كل بطاقة تفتح خطوات منهجها، وأي منهج جديد ينضاف في نفس المكان.",
  },
  en: {
    browse: "Browse paths",
    title: "Clear understanding, practical steps",
    body: "Masaarat Academic brings together structured paths that help you understand concepts and use them in practical situations. Choose a path, then explore its stations and steps.",
    features: [
      {
        title: "Explanations and examples",
        body: "Explore each concept through written explanations and a worked example connected to the step.",
      },
      {
        title: "Check and practise",
        body: "Check your understanding with questions, then apply what you have learned in a practical activity.",
      },
      {
        title: "One shared account",
        body: "Keep your progress in your Masaarat account, with separate access for each learning area.",
      },
    ],
    journey: "Your Academic learning journey",
    steps: [
      "Browse path cards and choose your subject.",
      "Open the path to explore its stations and ordered steps.",
      "Open a step to read, check and practise.",
    ],
    courses: "A place for every path",
    coursesBody:
      "The path catalogue shows the paths available to you as individual cards. Each card opens that path's steps, and new paths join the same catalogue.",
  },
};
export const getAcademicOverviewCopy = (locale: SupportedLocale) => copy[locale];
