// Pagina de erro branded TALOA (404 / 500). Mobile-first, sem dependencias.
// O botao usa <a href="/"> (funciona inclusive no global-error, fora do app).

export function ErrorPage({
  code,
  message,
}: {
  code: string;
  message: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A3A5C] px-6 py-16 text-center">
      <span className="text-4xl font-extrabold tracking-wide text-white sm:text-5xl">
        TALOA
      </span>
      <span className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
        Smart safety for pets
      </span>

      <p className="mt-10 text-7xl font-bold text-white/20">{code}</p>
      <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
        {message}
      </p>

      <a
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-[#E67E22] px-8 font-semibold text-white transition-colors hover:bg-[#d06f17]"
      >
        Go home
      </a>
    </main>
  );
}
