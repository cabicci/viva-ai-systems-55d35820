/** Owner-approved market scope. Inclusion is not permission to collect child data. */
export const KIDS_MARKETS = [
  { code: "DZ", ar: "الجزائر", en: "Algeria" },
  { code: "BH", ar: "البحرين", en: "Bahrain" },
  { code: "KM", ar: "جزر القمر", en: "Comoros" },
  { code: "DJ", ar: "جيبوتي", en: "Djibouti" },
  { code: "EG", ar: "مصر", en: "Egypt" },
  { code: "IQ", ar: "العراق", en: "Iraq" },
  { code: "JO", ar: "الأردن", en: "Jordan" },
  { code: "KW", ar: "الكويت", en: "Kuwait" },
  { code: "LB", ar: "لبنان", en: "Lebanon" },
  { code: "LY", ar: "ليبيا", en: "Libya" },
  { code: "MR", ar: "موريتانيا", en: "Mauritania" },
  { code: "MA", ar: "المغرب", en: "Morocco" },
  { code: "OM", ar: "عُمان", en: "Oman" },
  { code: "PS", ar: "فلسطين", en: "Palestine" },
  { code: "QA", ar: "قطر", en: "Qatar" },
  { code: "SA", ar: "السعودية", en: "Saudi Arabia" },
  { code: "SO", ar: "الصومال", en: "Somalia" },
  { code: "SD", ar: "السودان", en: "Sudan" },
  { code: "SY", ar: "سوريا", en: "Syria" },
  { code: "TN", ar: "تونس", en: "Tunisia" },
  { code: "AE", ar: "الإمارات", en: "United Arab Emirates" },
  { code: "YE", ar: "اليمن", en: "Yemen" },
] as const;

export function isKidsMarket(value: string): boolean {
  return KIDS_MARKETS.some((market) => market.code === value);
}
