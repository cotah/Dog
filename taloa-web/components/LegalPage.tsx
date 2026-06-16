import { Link } from "@/i18n/navigation";

// Wrapper das paginas de texto legal (/privacy, /terms). Header simples com
// logo TALOA + voltar, aviso discreto no topo, conteudo limpo, footer.
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between border-b border-slate-100 pb-4">
        <Link href="/" className="text-xl font-extrabold tracking-wide text-taloa-primary">
          TALOA
        </Link>
        <Link href="/" className="text-sm font-medium text-taloa-primary hover:underline">
          ← Back to home
        </Link>
      </header>

      {/* Aviso discreto */}
      <div className="mt-4 rounded-card bg-taloa-warning/10 px-3 py-2 text-xs leading-relaxed text-slate-600">
        This document was drafted with legal guidance in mind but has not been
        reviewed by a qualified solicitor. For legal queries contact{" "}
        <a href="mailto:hello@taloa.ie" className="font-medium text-taloa-primary">
          hello@taloa.ie
        </a>
        .
      </div>

      <h1 className="mt-6 text-2xl font-bold text-slate-800">{title}</h1>
      <p className="mt-1 text-xs text-slate-400">Last updated: {lastUpdated}</p>

      <div className="legal mt-4">{children}</div>

      <footer className="mt-10 border-t border-slate-100 pt-4 text-sm text-slate-500">
        Questions about this document?{" "}
        <a href="mailto:hello@taloa.ie" className="font-medium text-taloa-primary">
          hello@taloa.ie
        </a>
      </footer>
    </main>
  );
}
