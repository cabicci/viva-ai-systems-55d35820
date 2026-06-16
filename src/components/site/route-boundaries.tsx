import { Link, useRouter } from "@tanstack/react-router";
import { captureError } from "@/lib/error-capture";

/**
 * Shared 404 boundary. Used as the root `notFoundComponent` and as
 * the router's `defaultNotFoundComponent` so any child route inherits
 * it automatically.
 */
export function RouteNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة مش موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة اللي بتدوّر عليها مش موجودة أو اتنقلت.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ارجع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Shared error boundary. Used as the root `errorComponent` and as the
 * router's `defaultErrorComponent` so every loader/component error
 * lands here unless a route opts in to its own boundary.
 */
export function RouteError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  captureError("route", error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          الصفحة دي ما اتحملتش
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حصل خطأ من عندنا. جرّب تعيد المحاولة أو ارجع للرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}