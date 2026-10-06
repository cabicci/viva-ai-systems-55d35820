import type { SupportedLocale } from "@/lib/locale/types";
import { localizePathText } from "@/lib/path-story";
const titles: Record<string, readonly [string, string, string, string]> = {
  "AC-BUS-M01": [
    "أساسيات عالم الأعمال",
    "أساسيات عالم الأعمال",
    "أساسيات عالم الأعمال",
    "Business foundations",
  ],
  "AC-BUS-M02": [
    "صفات القائد وقدراته",
    "صفات القائد وقدراته",
    "صفات القائد وقدراته",
    "Leadership skills and capabilities",
  ],
  "AC-BUS-M03": [
    "الأعمال الصغيرة وكيفية بنائها",
    "الأعمال الصغيرة وكيفية بنائها",
    "الأعمال الصغيرة وكيفية بنائها",
    "Building a small business",
  ],
  "AC-BUS-M04": [
    "توليد الأفكار المبتكرة ودراسة جدواها",
    "توليد الأفكار المبتكرة ودراسة جدواها",
    "توليد الأفكار المبتكرة ودراسة جدواها",
    "Innovative ideas and feasibility",
  ],
  "AC-BUS-M05": [
    "التخطيط الاستراتيجي وإعداد خطة العمل",
    "التخطيط الاستراتيجي وإعداد خطة العمل",
    "التخطيط الاستراتيجي وإعداد خطة العمل",
    "Strategy and business planning",
  ],
  "AC-BUS-M06": [
    "تأسيس المشروع وتجهيزه للتشغيل",
    "تأسيس المشروع وتجهيزه للتشغيل",
    "تأسيس المشروع وتجهيزه للتشغيل",
    "Setting up a business for operation",
  ],
  "AC-BUS-M07": [
    "إدارة المشروع باحترافية",
    "إدارة المشروع باحترافية",
    "إدارة المشروع باحترافية",
    "Managing a business professionally",
  ],
};
export const getAcademicStationTitle = (id: string, locale: SupportedLocale) =>
  titles[id] ? localizePathText(titles[id], locale) : undefined;
