import Link from "next/link";

// Landing placeholder — sera construida na Etapa 8.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold text-taloa-primary">TALOA</h1>
      <p className="max-w-md text-lg text-slate-600">
        Smart safety for pets — starting in Dublin.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-input bg-taloa-primary px-5 py-3 font-medium text-white hover:bg-taloa-secondary"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-input border border-taloa-primary px-5 py-3 font-medium text-taloa-primary hover:bg-taloa-primary/5"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
