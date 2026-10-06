import type { SupportedLocale } from "@/lib/locale/types";

const copy = {
  "ar-EG": {
    browse: "تصفح المناهج",
    title: "فهم واضح، وتطبيق خطوة بخطوة",
    body: "مسارات أكاديمي بيجمع مناهج منظمة تساعدك تفهم المفاهيم وتستخدمها في مواقف عملية. اختار المنهج المناسب، وبعدها ادخل على وحداته ودروسه.",
    features: [
      { title: "شرح وأمثلة", body: "افهم الفكرة من شرح مكتوب ومثال محلول مرتبط بموضوع الدرس." },
      { title: "اختبار وتطبيق", body: "راجع فهمك بأسئلة، وطبّق اللي اتعلمته في نشاط عملي." },
      { title: "حساب واحد", body: "احتفظ بتقدمك في حساب مسارات نفسه، مع صلاحية مستقلة لكل مجال." },
    ],
    journey: "طريقك جوّه أكاديمي",
    steps: [
      "تصفح كروت المناهج واختار موضوعك.",
      "افتح المنهج وشوف الوحدات والدروس بالترتيب.",
      "ادخل الدرس واقرأ وراجع وطبّق.",
    ],
    courses: "كل منهج له مكانه",
    coursesBody:
      "صفحة المناهج بتجمع المقررات المتاحة ليك في كروت مستقلة. كل كارت بيفتح دروس منهجه، وأي منهج جديد بيتضاف في نفس المكان.",
  },
  "ar-MSA": {
    browse: "تصفح المناهج",
    title: "فهم واضح وتطبيق متدرّج",
    body: "تجمع مسارات أكاديمي مناهج منظّمة تساعدك على فهم المفاهيم واستخدامها في مواقف عملية. اختر المنهج المناسب، ثم استعرض وحداته ودروسه.",
    features: [
      { title: "شرح وأمثلة", body: "افهم الفكرة من شرح مكتوب ومثال محلول مرتبط بموضوع الدرس." },
      { title: "اختبار وتطبيق", body: "راجع فهمك بالأسئلة، وطبّق ما تعلمته في نشاط عملي." },
      { title: "حساب موحّد", body: "احتفظ بتقدمك في حساب مسارات نفسه، مع صلاحية مستقلة لكل مجال." },
    ],
    journey: "رحلتك داخل أكاديمي",
    steps: [
      "تصفح بطاقات المناهج واختر موضوعك.",
      "افتح المنهج واستعرض الوحدات والدروس بالترتيب.",
      "ادخل الدرس واقرأ وراجع وطبّق.",
    ],
    courses: "مساحة مستقلة لكل منهج",
    coursesBody:
      "تجمع صفحة المناهج المقررات المتاحة لك في بطاقات مستقلة. تفتح كل بطاقة دروس منهجها، وتُضاف المناهج الجديدة في الصفحة نفسها.",
  },
  "ar-Gulf": {
    browse: "تصفح المناهج",
    title: "فهم واضح، وتطبيق خطوة بخطوة",
    body: "مسارات أكاديمي يجمع مناهج منظّمة تساعدك تفهم المفاهيم وتستخدمها في مواقف عملية. اختر المنهج المناسب، وبعدها شوف وحداته ودروسه.",
    features: [
      { title: "شرح وأمثلة", body: "افهم الفكرة من شرح مكتوب ومثال محلول مرتبط بموضوع الدرس." },
      { title: "اختبار وتطبيق", body: "راجع فهمك بالأسئلة، وطبّق اللي تعلمته في نشاط عملي." },
      { title: "حساب واحد", body: "احتفظ بتقدمك في حساب مسارات نفسه، مع صلاحية مستقلة لكل مجال." },
    ],
    journey: "رحلتك داخل أكاديمي",
    steps: [
      "تصفح بطاقات المناهج واختر موضوعك.",
      "افتح المنهج وشوف الوحدات والدروس بالترتيب.",
      "ادخل الدرس واقرأ وراجع وطبّق.",
    ],
    courses: "كل منهج له مكانه",
    coursesBody:
      "صفحة المناهج تجمع المقررات المتاحة لك في بطاقات مستقلة. كل بطاقة تفتح دروس منهجها، وأي منهج جديد ينضاف في نفس المكان.",
  },
  en: {
    browse: "Browse courses",
    title: "Clear understanding, practical steps",
    body: "Masaarat Academic brings together structured courses that help you understand concepts and use them in practical situations. Choose a course, then explore its modules and lessons.",
    features: [
      {
        title: "Explanations and examples",
        body: "Explore each concept through written explanations and a worked example connected to the lesson.",
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
      "Browse course cards and choose your subject.",
      "Open the course to explore its modules and ordered lessons.",
      "Open a lesson to read, check and practise.",
    ],
    courses: "A place for every course",
    coursesBody:
      "The course catalogue shows the courses available to you as individual cards. Each card opens that course's lessons, and new courses join the same catalogue.",
  },
};
export const getAcademicOverviewCopy = (locale: SupportedLocale) => copy[locale];
