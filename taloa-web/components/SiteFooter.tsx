import { Link } from "@/i18n/navigation";

// Footer do site principal: links legais + contacto.
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/privacy" className="hover:text-taloa-primary">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-taloa-primary">
          Terms of Service
        </Link>
        <a href="mailto:hello@taloa.ie" className="hover:text-taloa-primary">
          hello@taloa.ie
        </a>
      </div>
      <p className="mt-2">© TALOA — Smart safety for pets, starting in Dublin.</p>
    </footer>
  );
}
