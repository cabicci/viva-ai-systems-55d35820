import { useId, useState } from "react";
import type { ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale/locale-context";

const labels = {
  "ar-EG": ["إظهار كلمة المرور", "إخفاء كلمة المرور"],
  "ar-MSA": ["إظهار كلمة المرور", "إخفاء كلمة المرور"],
  "ar-Gulf": ["إظهار كلمة المرور", "إخفاء كلمة المرور"],
  en: ["Show password", "Hide password"],
};
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const { locale } = useLocale();
  const label = labels[locale][visible ? 1 : 0];
  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        className={`pe-12 ${props.className ?? ""}`}
      />
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-controls={id}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible(!visible)}
        className="absolute end-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="h-5 w-5 shrink-0" aria-hidden="true" />
        ) : (
          <Eye className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
